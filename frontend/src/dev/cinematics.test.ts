import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
    planCinematic,
    endingCopy,
    endingAppearance,
    offeringDuration,
    mothershipAngry,
} from '../components/cinematics.ts';
import { fixtures } from './animation-fixtures.ts';

const final = (name: string) => fixtures[name].frames.at(-1)!;
test('successful sacrifice descends, beams exactly the offered cows, then departs', () => {
    const g = final('sacrifice');
    const plan = planCinematic(g, 0, false)!;
    assert.equal(plan.kind, 'sacrifice');
    assert.equal(plan.cows, 5);
    assert.deepEqual(
        plan.beats.map((b) => b.phase),
        ['arriving', 'beaming', 'departing'],
    );
    assert.equal(plan.ships.length, 4);
    assert.equal(planCinematic(g, g.round_event!.turn, false), null);
});
test('an insufficient sacrifice flashes red and destroys remaining ships', () => {
    const g = final('failure');
    const plan = planCinematic(g, 0, false)!;
    assert.equal(plan.kind, 'sacrifice_failed');
    assert.equal(plan.cows, 4);
    assert.deepEqual(
        plan.beats.map((b) => b.phase),
        ['arriving', 'beaming', 'warning', 'destroying', 'departing'],
    );
    assert.deepEqual(endingCopy(g), { title: 'Sacrifice Failed', body: '4 / 5 cows offered.' });
});
test('empty offering still arrives and punishes without inventing cows', () => {
    const g = structuredClone(final('failure'));
    g.round_event!.offered = 0;
    assert.deepEqual(
        planCinematic(g, 0, false)!.beats.map((b) => b.phase),
        ['arriving', 'warning', 'destroying', 'departing'],
    );
});
test('farmer victory panics and crashes surviving crews under the C++ rule', () => {
    const g = final('farmers');
    const plan = planCinematic(g, 0, false)!;
    assert.equal(g.end_reason, 'crew_destroyed');
    assert.equal(g.ships_destroyed, 1);
    assert.equal(plan.ships.length, 3);
    assert.deepEqual(
        plan.beats.map((b) => b.phase),
        ['panic', 'crashing'],
    );
    assert.deepEqual(endingCopy(g), { title: 'Farmers Defended', body: '1 Ship Destroyed.' });
    assert.equal(planCinematic(g, 0, true), null);
});
test('the all-ships phrase is used only when no ships survived', () => {
    const g = structuredClone(final('farmers'));
    g.pieces = g.pieces.filter((p) => p.kind > 4);
    g.ships_destroyed = 4;
    assert.equal(endingCopy(g).body, 'All 4 Ships Destroyed.');
});
test('alien win uses player wording and keeps C++ result priority', () => {
    const g = structuredClone(final('failure'));
    g.end_reason = 'cow_goal';
    g.winner = 1;
    assert.equal(planCinematic(g, 0, false)!.kind, 'aliens_win');
    assert.deepEqual(endingCopy(g), {
        title: 'A legendary cow caper.',
        body: 'You made it home with the cows.',
    });
});

test('a happy mothership beams up the fleet and departs on a win', () => {
    const g = final('aliens'),
        plan = planCinematic(g, 0, false)!;
    assert.equal(plan.kind, 'aliens_win');
    assert.deepEqual(
        plan.beats.map((b) => b.phase),
        ['arriving', 'uplifting', 'departing'],
    );
    assert.equal(plan.ships.length, 4);
    assert.equal(endingAppearance(g), 'aboard');
    assert.equal(endingAppearance(final('farmers')), 'crashed');
    assert.equal(endingAppearance(final('failure')), 'destroyed');
    assert.equal(planCinematic(g, 0, true), null);
});

test('failed sacrifices arrive smiling and become angry without a red-body effect', () => {
    assert.equal(mothershipAngry({ kind: 'sacrifice_failed', phase: 'arriving' }), false);
    assert.equal(mothershipAngry({ kind: 'sacrifice_failed', phase: 'beaming' }), false);
    for (const phase of ['warning', 'destroying', 'departing'] as const)
        assert.equal(mothershipAngry({ kind: 'sacrifice_failed', phase }), true);
    assert.equal(mothershipAngry({ kind: 'aliens_win', phase: 'departing' }), false);
});
test('large offerings hold until the last staggered cow has finished its ascent', () => {
    assert.equal(offeringDuration(5), 4200);
    assert.equal(offeringDuration(10), 5200);
    for (const cows of [1, 5, 10, 30, 100])
        assert.ok(offeringDuration(cows) > 2800 + (cows - 1) * 200);
});
