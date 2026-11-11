import manifest, { beatGrids } from './media-manifest';
import type { MusicBeats } from './components/musicBeats';
import { createAudioCache } from './audioCache';

export const assetUrl = (path: string) => manifest[path] ?? path;
export const { audioBytes, audioSource } = createAudioCache();
let opus: boolean | undefined;
export function musicUrl(track: string): string {
    opus ??= !!document.createElement('audio').canPlayType('audio/webm; codecs="opus"');
    const original = `/sounds/bgm/${track}-music.mp3`;
    return opus ? assetUrl(original) : original;
}
export function musicBeats(track: string): MusicBeats {
    // Keep original beat timing independent of the delivery codec.
    return beatGrids[track as keyof typeof beatGrids] ?? { times: [], bpm: 0, duration: 0 };
}
/** Begin immediately; bound background downloads so they cannot flood the connection. */
export function warmMedia() {
    const music = ['menu', 'lobby', 'game'].map(musicUrl);
    void audioSource(music[0]).catch(() => {});
    const rest = [
        ...Object.entries(manifest)
            .filter(([p]) => p.startsWith('/sounds/sound-effects/'))
            .map(([, url]) => url),
        ...music.slice(1),
    ];
    let next = 0;
    const load = async () => {
        while (next < rest.length) {
            const url = rest[next++];
            await audioSource(url).catch(() => {});
        }
    };
    void load();
    void load();
    // Warm sprites before the player leaves the menu. Images and audio stay same-origin.
    for (const [path, url] of Object.entries(manifest)) {
        if (path.startsWith('/images/')) {
            const image = new Image();
            image.decoding = 'async';
            image.src = url;
        }
    }
}
