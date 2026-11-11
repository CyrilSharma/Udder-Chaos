import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixtures } from './animation-fixtures.ts';
import { depositSpriteCount, stepDuration, stepEventKey } from '../components/stepTiming.ts';

test('real Rust pickup frames carry one abduction, with time to spin into the beam', () => {
    const events = fixtures.abduction.frames.flatMap((f) => f.events);
    assert.equal(events.length, 1);
    assert.deepEqual(events[0], { type: 'cow_abducted', x: 13, y: 14, kind: 1 });
    assert.equal(stepDuration(events), 1500);
    assert.equal(stepDuration([]), 500);
    assert.deepEqual(fixtures.abduction.frames.at(-1)!.events, []);
});
test('the captured UFO pops before the surviving crews crash', () => {
    const first = fixtures.farmers.frames[0];
    assert.equal(first.events.length, 1);
    assert.equal(first.events[0].type, 'ufo_popped');
    assert.equal(stepDuration(first.events), 1300);
    assert.equal(first.ships_destroyed, 1);
    assert.equal(first.pieces.filter((p) => p.kind <= 4).length, 3);
    assert.deepEqual(fixtures.farmers.frames.at(-1)!.events, []);
});

test('three cows deposit into another crew portal with time for each spiral', () => {
    const events = fixtures.deposit.frames.flatMap((f) => f.events);
    assert.deepEqual(events, [{ type: 'cow_deposited', x: 7, y: 8, kind: 1, count: 3 }]);
    assert.equal(fixtures.deposit.frames.at(-1)!.cows_collected, 3);
    assert.equal(depositSpriteCount(3), 3);
    assert.equal(stepDuration(events), 1800);
    assert.equal(depositSpriteCount(10000), 16);
    assert.equal(stepDuration([{ ...events[0], type: 'cow_deposited', count: 10000 }]), 3100);
    assert.deepEqual(fixtures.deposit.frames.at(-1)!.events, []);
});

test('consecutive cow captures have distinct animation instances on every substep', () => {
    const frames = fixtures.abduction_chain.frames;
    const captures = frames.flatMap((f) => f.events.filter((e) => e.type === 'cow_abducted'));
    assert.deepEqual(
        captures.map((e) => [e.x, e.y]),
        [
            [13, 14],
            [12, 14],
            [11, 14],
        ],
    );
    const keys = frames.slice(0, 3).map((f) => stepEventKey(f.events[0], 0));
    assert.equal(new Set(keys).size, 3);
    assert.deepEqual(frames.at(-1)!.events, []);
});
