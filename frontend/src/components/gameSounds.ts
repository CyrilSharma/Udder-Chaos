import type { StepEvent } from '../protocol';
import type { Cinematic } from './cinematics';

export type SoundCue = 'abduct' | 'pop' | 'laser' | 'malfunction' | 'happy';
export const cueAssets: Partial<Record<SoundCue, string>> = {
    abduct: 'ufo-abduction.ogg',
    pop: 'ufo-destroyed.mp3',
    laser: 'ufo-laser.ogg',
};
export function stepSounds(events: StepEvent[]): SoundCue[] {
    const sounds = new Set<SoundCue>();
    for (const event of events) {
        if (event.type === 'cow_abducted' || event.type === 'cow_deposited') sounds.add('abduct');
        if (event.type === 'ufo_popped') sounds.add('pop');
    }
    return [...sounds];
}
export function cinematicSounds(scene: Cinematic): SoundCue[] {
    if (scene.kind === 'aliens_win' && scene.phase === 'arriving') return ['happy'];
    if (scene.phase === 'warning' || scene.phase === 'panic') return ['malfunction'];
    if (scene.phase === 'destroying') return ['laser', 'pop'];
    if (scene.phase === 'crashing') return ['pop'];
    if (scene.phase === 'beaming' || scene.phase === 'uplifting') return ['abduct'];
    return [];
}

export function stepSoundDelay(cue: SoundCue): number {
    return cue === 'pop' ? 550 : cue === 'abduct' ? 250 : 0;
}
export function cinematicSoundDelay(scene: Cinematic, cue: SoundCue): number {
    if (scene.phase === 'crashing') return 1100;
    if (scene.phase === 'destroying' && cue === 'pop') return 350;
    return 0;
}
