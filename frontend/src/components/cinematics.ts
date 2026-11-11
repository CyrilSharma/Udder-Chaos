import type { GameView, Piece } from '../protocol';

export type CinematicKind = 'sacrifice' | 'sacrifice_failed' | 'farmers_win' | 'aliens_win';
export type CinematicPhase =
    | 'arriving'
    | 'beaming'
    | 'departing'
    | 'warning'
    | 'destroying'
    | 'panic'
    | 'crashing'
    | 'uplifting';
export type Cinematic = {
    kind: CinematicKind;
    phase: CinematicPhase;
    ships: Piece[];
    cows: number;
};
export type CinematicBeat = { phase: CinematicPhase; duration: number };
export type CinematicPlan = {
    kind: CinematicKind;
    cows: number;
    ships: Piece[];
    beats: CinematicBeat[];
};

export type EndingResolved = 'crashed' | 'destroyed' | 'aboard' | null;
export function endingAppearance(game: GameView | null | undefined): EndingResolved {
    if (game?.end_reason === 'crew_destroyed') return 'crashed';
    if (game?.end_reason === 'sacrifice_failed') return 'destroyed';
    if (game?.end_reason === 'cow_goal') return 'aboard';
    return null;
}

export function offeringDuration(count: number): number {
    return Math.max(4200, 3400 + Math.max(0, Math.min(count, 100) - 1) * 200);
}
export function mothershipAngry(scene: Pick<Cinematic, 'kind' | 'phase'>): boolean {
    return (
        scene.kind === 'sacrifice_failed' &&
        ['warning', 'destroying', 'departing'].includes(scene.phase)
    );
}

/** Presentation chooses a sequence from explicit Rust event/reason metadata. */
export function planCinematic(
    game: GameView,
    lastRound: number,
    endingPlayed: boolean,
): CinematicPlan | null {
    const ships = game.pieces.filter((p) => p.kind <= 4);
    if (!endingPlayed && game.winner === 1) {
        return {
            kind: 'aliens_win',
            cows: 0,
            ships,
            beats: [
                { phase: 'arriving', duration: 1600 },
                { phase: 'uplifting', duration: 2600 },
                { phase: 'departing', duration: 1600 },
            ],
        };
    }
    if (!endingPlayed && game.end_reason === 'crew_destroyed') {
        return {
            kind: 'farmers_win',
            cows: 0,
            ships,
            beats: [
                { phase: 'panic', duration: 1800 },
                { phase: 'crashing', duration: 1700 },
            ],
        };
    }
    const round = game.round_event;
    if (round && round.turn > lastRound) {
        // C++ resolves the cow goal before a failed sacrifice. Honor that outcome.
        if (!round.success && game.end_reason === 'cow_goal') return null;
        const kind = !round.success ? 'sacrifice_failed' : 'sacrifice';
        const beats: CinematicBeat[] = [{ phase: 'arriving', duration: 1600 }];
        if (round.offered > 0)
            beats.push({ phase: 'beaming', duration: offeringDuration(round.offered) });
        if (!round.success)
            beats.push(
                { phase: 'warning', duration: 1800 },
                { phase: 'destroying', duration: 2000 },
            );
        beats.push({ phase: 'departing', duration: 1600 });
        return { kind, cows: round.offered, ships, beats };
    }
    return null;
}

export function endingCopy(game: GameView): { title: string; body: string } {
    if (game.winner === 1)
        return { title: 'A legendary cow caper.', body: 'You made it home with the cows.' };
    if (game.end_reason === 'sacrifice_failed')
        return {
            title: 'Sacrifice Failed',
            body: `${game.round_event?.offered ?? game.cows_collected} / ${
                game.rules.cow_sacrifice
            } cows offered.`,
        };
    const all = game.pieces.every((p) => p.kind > 4) ? 'All ' : '';
    return {
        title: 'Farmers Defended',
        body: `${all}${game.ships_destroyed} ${
            game.ships_destroyed === 1 ? 'Ship' : 'Ships'
        } Destroyed.`,
    };
}
