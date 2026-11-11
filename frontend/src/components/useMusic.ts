import { useCallback, useEffect, useRef, type RefObject } from 'react';
import { musicHopAt } from './musicBeats';
import { audioSource, musicBeats, musicUrl } from '../media';
import { createMusicPlayback } from './musicPlayback';

export function useMusic(
    track: string,
    volume: number,
    root: RefObject<HTMLDivElement | null>,
    autoStart = true,
) {
    const audio = useRef<HTMLAudioElement | null>(null);
    const playback = useRef<ReturnType<typeof createMusicPlayback> | null>(null);
    const failure = useRef<() => void>(() => {});
    const currentVolume = useRef(volume);
    currentVolume.current = volume;
    const play = useCallback(() => playback.current?.play(), []);
    const pause = useCallback(() => playback.current?.pause(), []);
    const seek = useCallback((time: number) => {
        if (audio.current) audio.current.currentTime = time;
    }, []);
    useEffect(() => {
        const element = new Audio();
        element.preload = 'auto';
        element.loop = true;
        element.volume = currentVolume.current;
        element.muted = currentVolume.current === 0;
        audio.current = element;
        const control = createMusicPlayback(element, {
            visible: () => !document.hidden,
            now: () => performance.now(),
            onState: (state) => root.current?.setAttribute('data-music-playback', state),
            onFailure: () => failure.current(),
        });
        playback.current = control;
        const gesture = () => control.resume(true);
        const resume = () => control.resume();
        document.addEventListener('visibilitychange', resume);
        window.addEventListener('pageshow', resume);
        window.addEventListener('focus', resume);
        window.addEventListener('pointerdown', gesture);
        window.addEventListener('touchend', gesture);
        window.addEventListener('keydown', gesture);
        const watchdog = window.setInterval(() => control.check(), 1000);
        return () => {
            control.destroy();
            window.clearInterval(watchdog);
            document.removeEventListener('visibilitychange', resume);
            window.removeEventListener('pageshow', resume);
            window.removeEventListener('focus', resume);
            window.removeEventListener('pointerdown', gesture);
            window.removeEventListener('touchend', gesture);
            window.removeEventListener('keydown', gesture);
            audio.current = null;
            playback.current = null;
        };
    }, [root]);
    useEffect(() => {
        if (autoStart) play();
        else pause();
    }, [autoStart, play, pause]);
    useEffect(() => {
        const target = root.current;
        const element = audio.current!;
        let disposed = false,
            usedFallback = false,
            loaded = false;
        let activeUrl = musicUrl(track);
        target?.setAttribute('data-music-track', track);
        target?.setAttribute('data-music-status', 'loading');
        const load = (url: string) => {
            loaded = false;
            activeUrl = url;
            void audioSource(url)
                .then((source) => {
                    if (!disposed) {
                        loaded = true;
                        playback.current?.setSource(source);
                    }
                })
                .catch(() => {
                    if (!disposed) target?.setAttribute('data-music-status', 'unavailable');
                });
        };
        const primary = musicUrl(track);
        const fallback = `/sounds/bgm/${track}-music.mp3`;
        failure.current = () => {
            if (disposed || usedFallback || primary === fallback) return;
            usedFallback = true;
            target?.setAttribute('data-music-format', 'mp3-fallback');
            load(fallback);
        };
        load(primary);
        const retry = () => {
            if (!loaded && !disposed) load(activeUrl);
        };
        window.addEventListener('online', retry);
        window.addEventListener('pointerdown', retry);
        window.addEventListener('touchend', retry);
        target?.removeAttribute('data-music-format');
        const beats = musicBeats(track);
        target?.setAttribute('data-music-bpm', beats.bpm.toFixed(2));
        target?.setAttribute('data-music-beats', String(beats.times.length));
        target?.setAttribute('data-music-status', beats.times.length ? 'ready' : 'no-beats');
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
        let frame = 0;
        const tick = () => {
            const active =
                !element.paused &&
                !element.ended &&
                !element.seeking &&
                !document.hidden &&
                !reduced.matches;
            target?.style.setProperty(
                '--music-bop',
                (active ? musicHopAt(beats, element.currentTime) : 0).toFixed(3),
            );
            target?.setAttribute('data-music-time', element.currentTime.toFixed(3));
            target?.setAttribute('data-music-playing', String(!element.paused));
            frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
        return () => {
            disposed = true;
            window.removeEventListener('online', retry);
            window.removeEventListener('pointerdown', retry);
            window.removeEventListener('touchend', retry);
            cancelAnimationFrame(frame);
            target?.style.removeProperty('--music-bop');
        };
    }, [track, root]);
    useEffect(() => {
        if (audio.current) {
            audio.current.volume = volume;
            audio.current.muted = volume === 0;
        }
    }, [volume]);
    return { play, pause, seek, audio };
}
