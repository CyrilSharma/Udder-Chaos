import { useEffect, useRef, useState } from 'react';
import type { GameView, Snapshot } from '../protocol';
import { planCinematic, endingAppearance, type Cinematic, type EndingResolved } from './cinematics';
import { stepDuration } from './stepTiming';
import { CARD_TRAVEL_MS, exchangedCard, presentCardStep } from './cardPlayback';

/** Plays Rust's committed frames and event cinematics, without simulating rules. */
export function useGamePlayback(snapshot: Snapshot | null) {
    const [game, setGame] = useState<GameView | null>(null);
    const displayed = useRef<GameView | null>(null);
    const showGame = (view: GameView | null) => {
        displayed.current = view;
        setGame(view);
    };
    const [activeCard, setActiveCard] = useState<{
        hand: 'player' | 'enemy';
        slot: number;
        step: number;
    } | null>(null);
    const [animating, setAnimating] = useState(false);
    const [beat, setBeat] = useState<{ duration: number; next: () => void } | null>(null);
    const [scene, setScene] = useState<Cinematic | null>(null);
    const [endingResolved, setEndingResolved] = useState<EndingResolved>(null);
    const room = useRef<string | null>(null);
    const revision = useRef(-1);
    const lastRound = useRef(0);
    const endingPlayed = useRef(false);
    const queue = useRef<GameView[][]>([]);
    const running = useRef(false);
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Start each hold after React has committed and the first frame has painted.
    useEffect(() => {
        if (!beat) return;
        let secondPaint = 0;
        let hold: ReturnType<typeof setTimeout> | undefined;
        const firstPaint = requestAnimationFrame(() => {
            secondPaint = requestAnimationFrame(() => {
                hold = setTimeout(beat.next, beat.duration);
                timer.current = hold;
            });
        });
        return () => {
            cancelAnimationFrame(firstPaint);
            cancelAnimationFrame(secondPaint);
            clearTimeout(hold);
        };
    }, [beat]);
    useEffect(() => () => clearTimeout(timer.current), []);
    useEffect(() => {
        if (!snapshot || snapshot.room !== room.current) {
            clearTimeout(timer.current);
            setBeat(null);
            room.current = snapshot?.room ?? null;
            revision.current = snapshot?.revision ?? -1;
            queue.current = [];
            running.current = false;
            lastRound.current = snapshot?.game?.round_event?.turn ?? 0;
            endingPlayed.current = !!snapshot?.game?.winner;
            showGame(snapshot?.game ?? null);
            setActiveCard(null);

            setScene(null);
            setEndingResolved(endingAppearance(snapshot?.game));
            setAnimating(false);
            return;
        }
        if (snapshot.revision === revision.current) return;
        revision.current = snapshot.revision;
        if (snapshot.frames.length) queue.current.push(snapshot.frames);
        else if (!running.current) showGame(snapshot.game);
        if (running.current || queue.current.length === 0) return;

        const playNext = () => {
            const frames = queue.current.shift();
            if (!frames) {
                running.current = false;
                setBeat(null);
                setAnimating(false);
                return;
            }
            const before = displayed.current;
            const exchange = exchangedCard(before, frames[frames.length - 1]);
            running.current = true;
            setAnimating(true);
            const finish = () => {
                setActiveCard(null);
                const final = frames[frames.length - 1];
                const plan = planCinematic(final, lastRound.current, endingPlayed.current);
                if (final.round_event)
                    lastRound.current = Math.max(lastRound.current, final.round_event.turn);
                if (final.winner !== 0) endingPlayed.current = true;

                showGame(
                    plan && plan.kind !== 'farmers_win' && frames.length > 1
                        ? frames[frames.length - 2]
                        : final,
                );
                if (!plan) {
                    if (exchange && !window.matchMedia('(prefers-reduced-motion: reduce)').matches)
                        setBeat({ next: playNext, duration: CARD_TRAVEL_MS });
                    else playNext();
                    return;
                }
                let beat = 0;
                const advanceScene = () => {
                    if (beat === plan.beats.length) {
                        showGame(final);
                        setScene(null);
                        setEndingResolved(endingAppearance(final));
                        playNext();
                        return;
                    }
                    const current = plan.beats[beat++];
                    if (current.phase === 'departing') {
                        showGame(final);
                        setEndingResolved(endingAppearance(final));
                    }
                    setScene({
                        kind: plan.kind,
                        ships: plan.ships,
                        cows: plan.cows,
                        phase: current.phase,
                    });
                    setBeat({ next: advanceScene, duration: current.duration });
                };
                advanceScene();
            };
            const steps = frames.length - 1;
            if (steps === 0) {
                finish();
                return;
            }
            let index = 0;
            const advance = () => {
                if (index === steps) {
                    finish();
                    return;
                }
                const frame = frames[index++];
                showGame(presentCardStep(frame, before));
                setActiveCard(exchange ? { ...exchange, step: index - 1 } : null);
                setBeat({ next: advance, duration: stepDuration(frame.events) });
            };
            timer.current = setTimeout(advance, 80);
        };
        playNext();
    }, [snapshot?.room, snapshot?.revision]);

    return { game, animating, scene, endingResolved, activeCard };
}
