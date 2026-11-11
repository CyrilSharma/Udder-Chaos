/** One media element keeps its mobile playback permission across track changes. */
export function createMusicPlayback(
    audio: HTMLAudioElement,
    options: {
        visible: () => boolean;
        now: () => number;
        onState?: (state: string) => void;
        onFailure?: () => void;
    },
) {
    let wanted = false,
        disposed = false,
        pending = false,
        needsGesture = false;
    let attempt = 0,
        lastProgress = options.now(),
        lastTime = 0,
        repairs = 0;
    let seekAfterLoad: number | null = null;
    const resume = (gesture = false) => {
        if (gesture) needsGesture = false;
        if (disposed || !wanted || !options.visible() || !audio.src || pending || needsGesture)
            return;
        const id = ++attempt;
        pending = true;
        try {
            void Promise.resolve(audio.play())
                .then(() => {
                    if (!disposed && id === attempt) options.onState?.('playing');
                })
                .catch((error: { name?: string }) => {
                    if (disposed || id !== attempt) return;
                    needsGesture = error.name === 'NotAllowedError';
                    options.onState?.(error.name ?? 'unavailable');
                })
                .finally(() => {
                    if (id === attempt) pending = false;
                });
        } catch {
            pending = false;
        }
    };
    const loaded = () => {
        if (seekAfterLoad !== null) {
            if (Number.isFinite(audio.duration))
                audio.currentTime = Math.min(seekAfterLoad, Math.max(0, audio.duration - 0.01));
            seekAfterLoad = null;
        }
        resume();
    };
    const failed = () => {
        if (!disposed && audio.error?.code !== 1) options.onFailure?.();
    };
    const ended = () => {
        if (wanted) {
            audio.currentTime = 0;
            resume();
        }
    };
    audio.addEventListener('loadedmetadata', loaded);
    audio.addEventListener('error', failed);
    audio.addEventListener('ended', ended);
    return {
        setSource(source: string) {
            if (disposed || audio.src === source) return;
            attempt++;
            pending = false;
            needsGesture = false;
            seekAfterLoad = null;
            audio.src = source;
            audio.currentTime = 0;
            lastTime = 0;
            lastProgress = options.now();
            repairs = 0;
            resume();
        },
        play() {
            wanted = true;
            lastProgress = options.now();
            resume(true);
        },
        pause() {
            wanted = false;
            attempt++;
            pending = false;
            audio.pause();
            options.onState?.('paused');
        },
        resume,
        check() {
            const now = options.now();
            if (disposed || !wanted || !options.visible() || !audio.src || needsGesture) {
                lastProgress = now;
                return;
            }
            if (Math.abs(audio.currentTime - lastTime) > 0.01) {
                lastTime = audio.currentTime;
                lastProgress = now;
                repairs = 0;
                return;
            }
            if (now - lastProgress < 6000 || audio.seeking) return;
            lastProgress = now;
            if (audio.paused && !pending) {
                resume();
                return;
            }
            // Some mobile decoders report "playing" while their playhead has stopped.
            if (repairs++ > 0) options.onFailure?.();
            seekAfterLoad = audio.currentTime;
            attempt++;
            pending = false;
            audio.pause();
            audio.load();
            resume();
        },
        destroy() {
            disposed = true;
            attempt++;
            audio.pause();
            audio.removeEventListener('loadedmetadata', loaded);
            audio.removeEventListener('error', failed);
            audio.removeEventListener('ended', ended);
        },
    };
}
