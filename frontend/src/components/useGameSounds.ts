import { useEffect, useRef } from 'react';
import type { GameView } from '../protocol';
import type { Cinematic } from './cinematics';
import { assetUrl, audioSource } from '../media';
import {
    cueAssets,
    stepSounds,
    cinematicSounds,
    stepSoundDelay,
    cinematicSoundDelay,
    type SoundCue,
} from './gameSounds';

/** Cues follow committed playback frames and phases, never polling frequency. */
export function useGameSounds(
    game: GameView | null,
    scene: Cinematic | null,
    volume: number,
    muted: boolean,
    room: string | null,
) {
    const seenFrames = useRef(new WeakSet<GameView>());
    const seenScenes = useRef(new WeakSet<Cinematic>());
    const active = useRef(new Set<HTMLAudioElement>());
    const context = useRef<AudioContext | null>(null);
    const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
    const settings = useRef({ volume, muted });
    settings.current = { volume, muted };
    const stop = () => {
        for (const timer of timers.current) clearTimeout(timer);
        timers.current.clear();
        for (const audio of active.current) audio.pause();
        active.current.clear();
        void context.current?.close().catch(() => {});
        context.current = null;
    };
    useEffect(() => () => stop(), [room]);
    useEffect(() => {
        if (muted || volume === 0) stop();
        else for (const audio of active.current) audio.volume = volume;
    }, [muted, volume]);
    const playAsset = (file: string) => {
        const audio = new Audio();
        audio.volume = settings.current.volume;
        active.current.add(audio);
        audio.addEventListener('ended', () => active.current.delete(audio), { once: true });
        void audioSource(assetUrl(`/sounds/sound-effects/${file}`))
            .then((source) => {
                if (
                    !active.current.has(audio) ||
                    settings.current.muted ||
                    settings.current.volume <= 0
                )
                    return;
                audio.src = source;
                audio.volume = settings.current.volume;
                return audio.play();
            })
            .catch(() => active.current.delete(audio));
    };
    const play = (cue: SoundCue) => {
        const { volume, muted } = settings.current;
        if (muted || volume <= 0) return;
        const file = cueAssets[cue];
        if (file) {
            playAsset(file);
            return;
        }
        try {
            const c = (context.current ??= new AudioContext());
            void c.resume().catch(() => {});
            const now = c.currentTime;
            const notes = cue === 'happy' ? [523.25, 659.25, 783.99, 1046.5] : [360];
            notes.forEach((frequency, index) => {
                const start = now + index * 0.13,
                    duration = cue === 'happy' ? 0.24 : 0.7;
                const voice = c.createOscillator(),
                    gain = c.createGain();
                voice.type = cue === 'happy' ? 'triangle' : 'sawtooth';
                voice.frequency.setValueAtTime(frequency, start);
                gain.gain.setValueAtTime(0, start);
                gain.gain.linearRampToValueAtTime(volume * 0.09, start + 0.012);
                if (cue === 'malfunction') {
                    voice.frequency.setValueAtTime(170, start + 0.12);
                    voice.frequency.setValueAtTime(310, start + 0.22);
                    voice.frequency.exponentialRampToValueAtTime(65, start + 0.65);
                    gain.gain.setValueAtTime(volume * 0.02, start + 0.15);
                    gain.gain.setValueAtTime(volume * 0.09, start + 0.23);
                }
                gain.gain.linearRampToValueAtTime(0, start + duration);
                voice.connect(gain).connect(c.destination);
                voice.onended = () => {
                    voice.disconnect();
                    gain.disconnect();
                };
                voice.start(start);
                voice.stop(start + duration);
            });
        } catch {
            if (cue === 'malfunction') playAsset(cueAssets.pop!);
        }
    };
    const schedule = (cue: SoundCue, delay: number) => {
        if (settings.current.muted || settings.current.volume <= 0) return;
        const timer = setTimeout(() => {
            timers.current.delete(timer);
            play(cue);
        }, delay);
        timers.current.add(timer);
    };
    useEffect(() => {
        if (!game || seenFrames.current.has(game)) return;
        seenFrames.current.add(game);
        for (const cue of stepSounds(game.events ?? [])) schedule(cue, stepSoundDelay(cue));
    }, [game, volume, muted]);
    useEffect(() => {
        if (!scene || seenScenes.current.has(scene)) return;
        seenScenes.current.add(scene);
        for (const cue of cinematicSounds(scene)) schedule(cue, cinematicSoundDelay(scene, cue));
    }, [scene, volume, muted]);
}
