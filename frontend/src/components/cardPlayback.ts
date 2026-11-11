import type { GameView } from '../protocol';

export const CARD_TRAVEL_MS = 1200;

export function exchangedCard(before: GameView | null, after: GameView) {
    if (!before) return null;
    for (const hand of ['player', 'enemy'] as const) {
        const slot = before.deck[hand].findIndex((id, i) => id !== after.deck[hand][i]);
        if (slot !== -1) return { hand, slot };
    }
    return null;
}

// Show the card being executed until all its arrows finish, then exchange it.
export function presentCardStep(frame: GameView, before: GameView | null): GameView {
    return before ? { ...frame, deck: before.deck } : frame;
}

export function displayedTurnIsCurrent(
    displayed: GameView | null | undefined,
    latest: GameView | null | undefined,
) {
    return (
        !!displayed &&
        !!latest &&
        displayed.turn === latest.turn &&
        displayed.player_id === latest.player_id
    );
}
