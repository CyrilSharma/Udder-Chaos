import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fixtures } from './animation-fixtures.ts';
import {
    displayedTurnIsCurrent,
    exchangedCard,
    presentCardStep,
} from '../components/cardPlayback.ts';

test('reported first-turn card follows up, left, left at each Rust substep', () => {
    const { initial, frames } = fixtures.card_order;
    assert.deepEqual(initial.deck.cards[initial.deck.player[0]], [3, 2, 2]);
    assert.deepEqual(
        frames.slice(0, -1).map((f) => {
            const p = f.pieces.find((p) => p.kind === 1)!;
            return [p.x, p.y];
        }),
        [
            [5, 4],
            [4, 4],
            [3, 4],
        ],
    );
});

test('executing arrows remain the selected card until the last substep finishes', () => {
    const { initial, frames } = fixtures.card_order;
    assert.deepEqual(exchangedCard(initial, frames.at(-1)!), { hand: 'player', slot: 0 });
    for (const frame of frames.slice(0, -1)) {
        const shown = presentCardStep(frame, initial);
        assert.equal(shown.pieces, frame.pieces);
        assert.equal(shown.deck, initial.deck);
        assert.deepEqual(shown.deck.cards[shown.deck.player[0]], [3, 2, 2]);
        assert.notEqual(frame.deck.player[0], initial.deck.player[0]);
    }
    assert.notEqual(frames.at(-1)!.deck.player[0], initial.deck.player[0]);
});

test('a hand from an earlier displayed turn cannot submit against a newer revision', () => {
    const { initial, frames } = fixtures.card_order;
    assert.equal(displayedTurnIsCurrent(initial, { ...initial }), true);
    assert.equal(displayedTurnIsCurrent(initial, frames.at(-1)!), false);
    assert.equal(displayedTurnIsCurrent(null, initial), false);
    assert.equal(displayedTurnIsCurrent(initial, null), false);
});

test('up-left-left retains its order on the original field, including the last-arrow pickup', () => {
    const { initial, frames } = fixtures.card_order_field;
    assert.deepEqual(initial.deck.cards[initial.deck.player[2]], [3, 2, 2]);
    assert.deepEqual(
        frames.slice(0, -1).map((frame) => {
            const ship = frame.pieces.find((p) => p.kind === 1)!;
            return [ship.x, ship.y];
        }),
        [
            [14, 13],
            [13, 13],
            [12, 13],
        ],
    );
    assert.deepEqual(frames[2].events, [{ type: 'cow_abducted', x: 12, y: 13, kind: 1 }]);
});
