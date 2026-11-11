import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createAudioCache } from '../audioCache.ts';

test('preload, playback, and beat analysis share one in-flight download and object URL', async () => {
    let requests = 0,
        urls = 0;
    let finish!: (blob: Blob) => void;
    const bytes = new Blob(['audio']);
    const cache = createAudioCache(
        () => {
            requests++;
            return new Promise((resolve) => {
                finish = resolve;
            });
        },
        () => {
            urls++;
            return 'blob:shared';
        },
    );
    const preload = cache.audioSource('/track');
    const playback = cache.audioSource('/track');
    const analysis = cache.audioBytes('/track');
    assert.equal(preload, playback);
    assert.equal(requests, 1);
    finish(bytes);
    assert.equal(await preload, 'blob:shared');
    assert.equal(await analysis, bytes);
    assert.equal(await cache.audioSource('/track'), 'blob:shared');
    assert.equal(requests, 1);
    assert.equal(urls, 1);
});

test('a failed preload can retry instead of permanently silencing the track', async () => {
    let attempts = 0;
    const cache = createAudioCache(
        async () => {
            if (++attempts === 1) throw Error('offline');
            return new Blob(['audio']);
        },
        () => 'blob:retry',
    );
    await assert.rejects(cache.audioSource('/track'), /offline/);
    assert.equal(await cache.audioSource('/track'), 'blob:retry');
    assert.equal(attempts, 2);
});
