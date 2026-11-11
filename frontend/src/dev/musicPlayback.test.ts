import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate } from 'node:timers/promises';
import { createMusicPlayback } from '../components/musicPlayback.ts';

class AudioStub extends EventTarget {
    src = '';
    currentTime = 0;
    duration = 120;
    paused = true;
    seeking = false;
    playCalls = 0;
    loads = 0;
    blocked = false;
    error = { code: 0 };
    play() {
        this.playCalls++;
        if (this.blocked)
            return Promise.reject(new DOMException('Gesture needed', 'NotAllowedError'));
        this.paused = false;
        return Promise.resolve();
    }
    pause() {
        this.paused = true;
    }
    load() {
        this.loads++;
        this.currentTime = 0;
    }
}
function setup() {
    const audio = new AudioStub();
    let now = 0,
        visible = true,
        failures = 0;
    const control = createMusicPlayback(audio as unknown as HTMLAudioElement, {
        now: () => now,
        visible: () => visible,
        onFailure: () => failures++,
    });
    return {
        audio,
        control,
        advance: (ms: number) => (now += ms),
        visible: (v: boolean) => (visible = v),
        failures: () => failures,
    };
}
test('one player retains playback intent across screen/track changes', async () => {
    const { audio, control } = setup();
    control.play();
    control.setSource('blob:menu');
    await setImmediate();
    assert.equal(audio.paused, false);
    audio.currentTime = 12;
    control.setSource('blob:lobby');
    await setImmediate();
    assert.equal(audio.src, 'blob:lobby');
    assert.equal(audio.currentTime, 0);
    assert.equal(audio.playCalls, 2);
    control.destroy();
});
test('foreground resume recovers an interruption while explicit pause stays paused', async () => {
    const f = setup();
    f.control.play();
    f.control.setSource('blob:music');
    await setImmediate();
    f.audio.paused = true;
    f.visible(false);
    f.advance(10000);
    f.control.check();
    assert.equal(f.audio.playCalls, 1);
    f.visible(true);
    f.control.resume();
    await setImmediate();
    assert.equal(f.audio.paused, false);
    f.control.pause();
    f.control.resume(true);
    f.control.setSource('blob:next');
    f.advance(10000);
    f.control.check();
    assert.equal(f.audio.paused, true);
    assert.equal(f.audio.playCalls, 2);
    f.control.destroy();
});
test('autoplay rejection waits for a gesture instead of retrying every watchdog tick', async () => {
    const f = setup();
    f.audio.blocked = true;
    f.control.play();
    f.control.setSource('blob:music');
    await setImmediate();
    f.advance(10000);
    f.control.check();
    assert.equal(f.audio.playCalls, 1);
    f.audio.blocked = false;
    f.control.resume(true);
    await setImmediate();
    assert.equal(f.audio.paused, false);
    f.control.destroy();
});
test('a frozen playhead reloads the same player and restores its position', async () => {
    const f = setup();
    f.control.play();
    f.control.setSource('blob:music');
    await setImmediate();
    f.audio.currentTime = 42;
    f.control.check();
    f.advance(6001);
    f.control.check();
    await setImmediate();
    assert.equal(f.audio.loads, 1);
    f.audio.dispatchEvent(new Event('loadedmetadata'));
    await setImmediate();
    assert.equal(f.audio.currentTime, 42);
    assert.equal(f.audio.paused, false);
    assert.equal(f.audio.src, 'blob:music');
    f.control.destroy();
});
test('repeated decoder stalls can request format fallback and decoding errors are reported', async () => {
    const f = setup();
    f.control.play();
    f.control.setSource('blob:music');
    await setImmediate();
    f.advance(6001);
    f.control.check();
    await setImmediate();
    f.advance(6001);
    f.control.check();
    await setImmediate();
    assert.equal(f.failures(), 1);
    f.audio.error = { code: 3 };
    f.audio.dispatchEvent(new Event('error'));
    assert.equal(f.failures(), 2);
    f.control.destroy();
});
test('ended playback loops again, but disposal stops recovery and delayed sources', async () => {
    const f = setup();
    f.control.play();
    f.control.setSource('blob:music');
    await setImmediate();
    f.audio.currentTime = 120;
    f.audio.paused = true;
    f.audio.dispatchEvent(new Event('ended'));
    await setImmediate();
    assert.equal(f.audio.currentTime, 0);
    assert.equal(f.audio.paused, false);
    f.control.destroy();
    const calls = f.audio.playCalls;
    f.advance(10000);
    f.control.check();
    f.control.resume(true);
    f.control.setSource('blob:late');
    assert.equal(f.audio.playCalls, calls);
    assert.equal(f.audio.src, 'blob:music');
    assert.equal(f.audio.paused, true);
});
