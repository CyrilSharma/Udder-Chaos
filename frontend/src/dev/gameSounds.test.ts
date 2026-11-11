import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import {
    cueAssets,
    stepSounds,
    cinematicSounds,
    stepSoundDelay,
    cinematicSoundDelay,
} from '../components/gameSounds.ts';

test('capture sounds use the existing abduction and destruction assets once per frame', () => {
    assert.deepEqual(
        stepSounds([
            { type: 'cow_abducted', x: 1, y: 2, kind: 1 },
            { type: 'cow_abducted', x: 2, y: 2, kind: 1 },
        ]),
        ['abduct'],
    );
    assert.deepEqual(stepSounds([{ type: 'ufo_popped', x: 1, y: 2, kind: 1, farmer_kind: 5 }]), [
        'pop',
    ]);
    for (const file of Object.values(cueAssets))
        assert.ok(existsSync(`frontend/public/sounds/sound-effects/${file}`));
});
test('loss phases malfunction then destroy; winning phases celebrate then beam', () => {
    const scene = {
        kind: 'sacrifice_failed' as const,
        phase: 'warning' as const,
        ships: [],
        cows: 0,
    };
    assert.deepEqual(cinematicSounds(scene), ['malfunction']);
    assert.deepEqual(cinematicSounds({ ...scene, phase: 'destroying' }), ['laser', 'pop']);
    assert.deepEqual(cinematicSounds({ ...scene, kind: 'farmers_win', phase: 'crashing' }), [
        'pop',
    ]);
    assert.deepEqual(cinematicSounds({ ...scene, kind: 'aliens_win', phase: 'arriving' }), [
        'happy',
    ]);
    assert.deepEqual(cinematicSounds({ ...scene, kind: 'aliens_win', phase: 'uplifting' }), [
        'abduct',
    ]);
    assert.deepEqual(cinematicSounds({ ...scene, phase: 'departing' }), []);
});

test('pop audio lands on the pitchfork hit and crash impact', () => {
    assert.equal(stepSoundDelay('pop'), 550);
    assert.equal(stepSoundDelay('abduct'), 250);
    assert.equal(
        cinematicSoundDelay({ kind: 'farmers_win', phase: 'crashing', ships: [], cows: 0 }, 'pop'),
        1100,
    );
});
