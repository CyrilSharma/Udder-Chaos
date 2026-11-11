import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyzeMusic, musicHopAt, playbackBeats } from '../components/musicBeats.ts';

function kicks(bpm: number, offset = 0.2, seconds = 24) {
    const rate = 11025;
    const samples = new Float32Array(rate * seconds);
    for (let beat = offset; beat < seconds; beat += 60 / bpm) {
        for (let j = 0; j < rate * 0.15 && Math.floor(beat * rate) + j < samples.length; j++) {
            samples[Math.floor(beat * rate) + j] +=
                Math.sin((j * 2 * Math.PI * 90) / rate) * Math.exp(-j / (rate * 0.025));
        }
    }
    return { samples, rate };
}
for (const tempo of [90, 120, 145])
    test(`finds ${tempo} BPM attacks without drift`, () => {
        const { samples, rate } = kicks(tempo);
        const beats = analyzeMusic(samples, rate);
        assert.ok(Math.abs(beats.bpm - tempo) < 0.6, `got ${beats.bpm} BPM`);
        assert.ok(beats.times.length >= 30);
        for (const time of beats.times) {
            const expected = 0.2 + Math.round((time - 0.2) / (60 / tempo)) * (60 / tempo);
            assert.ok(Math.abs(time - expected) < 0.05, `${time} vs ${expected}`);
        }
    });
test('silence and short clips produce no invented beat', () => {
    assert.equal(analyzeMusic(new Float32Array(11025 * 5), 11025).times.length, 0);
    assert.equal(analyzeMusic(new Float32Array(100), 11025).times.length, 0);
});
test('hop follows the audio clock across seeks and loops, and settles between beats', () => {
    const beats = { times: [0.2, 0.7, 1.2], bpm: 120, duration: 1.7 };
    assert.equal(musicHopAt(beats, 0.1), 0);
    assert.ok(musicHopAt(beats, 0.38) > 0.99);
    assert.equal(musicHopAt(beats, 0.65), 0);
    assert.equal(musicHopAt(beats, 10), 0);
    assert.equal(musicHopAt(beats, 0.38), musicHopAt(beats, 0.88));
    assert.equal(musicHopAt({ times: [], bpm: 0, duration: 5 }, 1), 0);
});

test('the homepage bobs on every other menu beat while game and lobby retain their pulse', () => {
    const original = { times: [0.2, 0.54, 0.88, 1.22, 1.56], bpm: 176, duration: 2 };
    const menu = playbackBeats('menu', original);
    assert.equal(menu.bpm, 88);
    assert.deepEqual(menu.times, [0.2, 0.88, 1.56]);
    assert.equal(musicHopAt(menu, 0.65), 0);
    assert.ok(musicHopAt(menu, 1) > 0);
    assert.equal(playbackBeats('game', original), original);
    assert.equal(playbackBeats('lobby', original), original);
});
