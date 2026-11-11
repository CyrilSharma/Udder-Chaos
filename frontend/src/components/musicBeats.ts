export type MusicBeats = { times: number[]; bpm: number; duration: number };

/** Extract a regular beat grid from the bundled track's bass attacks. Runs once per track. */
export function analyzeMusic(samples: Float32Array, sampleRate: number): MusicBeats {
    const step = 0.01;
    const stride = Math.max(1, Math.floor(sampleRate / 11025));
    const rate = sampleRate / stride;
    const hop = Math.round(rate * step);
    const energy: number[] = [];
    const fast = 1 - Math.exp((-2 * Math.PI * 220) / rate);
    const slow = 1 - Math.exp((-2 * Math.PI * 45) / rate);
    let upper = 0,
        lower = 0,
        sum = 0,
        count = 0;
    for (let i = 0; i < samples.length; i += stride) {
        upper += fast * (samples[i] - upper);
        lower += slow * (upper - lower);
        sum += (upper - lower) ** 2;
        if (++count === hop) {
            energy.push(Math.sqrt(sum / count));
            sum = 0;
            count = 0;
        }
    }
    const frameTime = hop / rate;
    const duration = samples.length / sampleRate;
    const maximum = energy.reduce((a, b) => Math.max(a, b), 0);
    if (maximum < 0.0001 || energy.length < 150) return { times: [], bpm: 0, duration };
    const onset = energy.map(
        (e, i) => Math.max(0, e - (energy[Math.max(0, i - 2)] ?? 0)) / maximum,
    );
    const minimumLag = Math.round(60 / 190 / frameTime);
    const maximumLag = Math.round(60 / 70 / frameTime);
    let lag = minimumLag,
        best = 0;
    for (let candidate = minimumLag; candidate <= maximumLag; candidate++) {
        let score = 0;
        for (let i = candidate; i < onset.length; i++)
            score +=
                onset[i] *
                Math.max(
                    onset[i - candidate - 1] ?? 0,
                    onset[i - candidate],
                    onset[i - candidate + 1] ?? 0,
                );
        // Slightly prefer a walking beat over double/half-time ties.
        score *= Math.exp(-0.12 * Math.log((candidate * frameTime) / 0.5) ** 2);
        if (score > best) {
            best = score;
            lag = candidate;
        }
    }
    if (best < 0.001) return { times: [], bpm: 0, duration };
    // Refine the tempo continuously so rounding a frame cannot accumulate drift.
    let period = lag,
        phase = 0,
        gridScore = -Infinity;
    for (let candidate = lag - 1; candidate <= lag + 1; candidate += 0.025) {
        for (let offset = 0; offset < candidate; offset++) {
            let score = 0;
            for (let t = offset; t < onset.length; t += candidate) {
                const i = Math.round(t);
                score += Math.max(onset[i - 1] ?? 0, onset[i] ?? 0, onset[i + 1] ?? 0);
            }
            if (score > gridScore) {
                gridScore = score;
                period = candidate;
                phase = offset;
            }
        }
    }
    const times: number[] = [];
    for (let t = phase; t < energy.length; t += period) {
        // Follow the actual attack near the grid, retaining a beat through quieter notes.
        let peak = Math.round(t);
        for (
            let i = Math.max(0, peak - 3);
            i <= Math.min(onset.length - 1, Math.round(t) + 3);
            i++
        ) {
            if (onset[i] > onset[peak]) peak = i;
        }
        if (energy[peak] > maximum * 0.025) times.push(peak * frameTime);
    }
    return { times, bpm: 60 / (period * frameTime), duration };
}

/** Sample the audio clock directly, so pausing, seeking and looping cannot drift. */
export function musicHopAt(beats: MusicBeats, time: number): number {
    let low = 0,
        high = beats.times.length;
    while (low < high) {
        const middle = (low + high) >>> 1;
        if (beats.times[middle] <= time) low = middle + 1;
        else high = middle;
    }
    if (low === 0) return 0;
    const sinceBeat = time - beats.times[low - 1];
    const duration = Math.min(0.36, (60 / beats.bpm) * 0.72);
    if (sinceBeat < 0 || sinceBeat >= duration) return 0;
    return Math.sin((Math.PI * sinceBeat) / duration);
}

/** The menu tune's detected pulse is double the intended visual walking beat. */
export function playbackBeats(track: string, beats: MusicBeats): MusicBeats {
    if (track !== 'menu') return beats;
    return {
        ...beats,
        times: beats.times.filter((_, index) => index % 2 === 0),
        bpm: beats.bpm / 2,
    };
}
