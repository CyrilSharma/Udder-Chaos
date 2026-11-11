import { UfoPurchaseButton } from '../components/UfoPurchaseButton';
import { useEffect, useState, type CSSProperties } from 'react';
import { createRoot } from 'react-dom/client';
import { Board } from '../components/Board';
import { Card } from '../components/Card';
import { useGamePlayback } from '../components/useGamePlayback';
import {
    endingCopy,
    endingAppearance,
    planCinematic,
    type CinematicPhase,
    type Cinematic,
} from '../components/cinematics';
import type { Snapshot } from '../protocol';
import { fixtures } from './animation-fixtures';
import '../style.css';

function Preview() {
    const params = new URLSearchParams(location.search);
    const scenario = params.get('scenario') ?? 'sacrifice';
    const phase = params.get('phase') ?? '';
    const fixture = fixtures[scenario] ?? fixtures.sacrifice;
    const final = fixture.frames.at(-1)!;
    const plan = planCinematic(final, 0, false);
    const pinned = plan?.beats.some((b) => b.phase === phase)
        ? ({
              kind: plan.kind,
              cows: plan.cows,
              ships: plan.ships,
              phase: phase as CinematicPhase,
          } as Cinematic)
        : null;
    const pinnedStep = phase === 'step' ? fixture.frames.find((f) => f.events?.length) : undefined;
    const result = phase === 'result';
    const [condition, setCondition] = useState(scenario);
    const [chosenPhase, setChosenPhase] = useState(phase);
    const choice = fixtures[condition] ?? fixtures.sacrifice;
    const choicePlan = planCinematic(choice.frames.at(-1)!, 0, false);
    const phaseNames: Record<string, string> = {
        arriving: 'Mothership arrival',
        beaming: 'Cow beams',
        warning: 'Red warning',
        destroying: 'Destruction',
        panic: 'Ship panic',
        crashing: 'Ship crash',
        uplifting: 'UFO beams',
        departing: 'Mothership departure',
    };
    const initial: Snapshot = {
        version: 1,
        room: `preview-${scenario}`,
        revision: 0,
        players: [],
        settings: {
            seed: 0,
            map_id: 0,
            card_deck_size: 15,
            timer_length: 30,
            difficulty: 1000,
            threads: 1,
            rules: fixture.initial.rules,
        },
        game: fixture.initial,
        frames: [],
        you: 0,
        host: true,
        solo: true,
        turn_deadline_ms: Date.now() + 30000,
    };
    const [snapshot, setSnapshot] = useState(initial);
    const [purchase, setPurchase] = useState('');
    const playback = useGamePlayback(snapshot);
    const [path, setPath] = useState<string[]>([]);
    useEffect(() => {
        if (!scenario.startsWith('card_order') || !playback.game) return;
        const ship = playback.game.pieces.find((p) => p.kind === 1)!;
        setPath((previous) => [...previous, `${ship.x},${ship.y}`]);
    }, [playback.game]);
    const g = pinnedStep ?? (pinned || result ? final : playback.game ?? fixture.initial);
    const scene = pinned ?? playback.scene;
    const resolved =
        result || pinned?.phase === 'departing' ? endingAppearance(final) : playback.endingResolved;
    const start = () => {
        setPath([]);
        const base = { ...initial, room: `preview-${scenario}-${Date.now()}` };
        setSnapshot(base);
        setTimeout(
            () => setSnapshot({ ...base, revision: 1, game: final, frames: fixture.frames }),
            150,
        );
    };
    const copy = endingCopy(g);
    return (
        <>
            <form method="get" className="preview-controls">
                <label>
                    Condition
                    <select
                        name="scenario"
                        value={condition}
                        onChange={(e) => {
                            setCondition(e.target.value);
                            setChosenPhase('');
                        }}
                    >
                        <option value="card_order">Card order: ↑ ← ←</option>
                        <option value="card_order_field">
                            Card order on original field: ↑ ← ←
                        </option>
                        <option value="abduction">Cow abduction</option>
                        <option value="abduction_chain">Three cow pickups</option>
                        <option value="deposit">Portal deposit</option>
                        <option value="purchase">Buy at your portal</option>
                        <option value="sacrifice">Successful sacrifice</option>
                        <option value="failure">Failed sacrifice</option>
                        <option value="farmers">Farmer victory</option>
                        <option value="aliens">Alien victory</option>
                    </select>
                </label>
                <label>
                    Phase
                    <select
                        name="phase"
                        value={chosenPhase}
                        onChange={(e) => setChosenPhase(e.target.value)}
                    >
                        <option value="">Full sequence</option>
                        {choicePlan?.beats.map((b) => (
                            <option key={b.phase} value={b.phase}>
                                {phaseNames[b.phase]}
                            </option>
                        ))}
                        {choice.frames.some((f) => f.events?.length) && (
                            <option value="step">Capture substep</option>
                        )}
                        <option value="result">Result</option>
                    </select>
                </label>
                <label>
                    Animation time (seconds)
                    <input
                        type="number"
                        name="at"
                        min="0"
                        max="1.5"
                        step="0.05"
                        defaultValue={params.get('at') ?? '0.65'}
                    />
                </label>
                <button type="submit">Jump to condition</button>
                {!phase && (
                    <button type="button" onClick={start} disabled={playback.animating}>
                        Play sequence
                    </button>
                )}
            </form>
            <main
                className={
                    pinnedStep ? 'step-effects-preview' : pinned ? 'cinematic-effects-preview' : ''
                }
                style={
                    {
                        width: 'min(78vw,600px)',
                        margin: '160px auto 40px',
                        '--step-preview-time': `-${Math.max(0, Number(params.get('at') ?? 0.65))}s`,
                    } as CSSProperties
                }
            >
                {scenario === 'purchase' && (
                    <>
                        <UfoPurchaseButton
                            game={g}
                            disabled={playback.animating}
                            onBuy={(action) => {
                                setPurchase(JSON.stringify(action));
                                start();
                            }}
                        />
                        <output aria-label="Purchase action">{purchase}</output>
                    </>
                )}
                <Board game={g} scene={scene} endingResolved={resolved} />
                <div
                    className={`hand crew-${g.player_id} ${g.turn % 3 === 2 ? 'farmer-turn' : ''}`}
                    style={{ marginTop: 24 }}
                >
                    {g.deck.player.map((id, i) => (
                        <div className="hand-card" key={i}>
                            <button className="play-card" disabled={playback.animating}>
                                <Card
                                    dirs={g.deck.cards[id]}
                                    activeStep={
                                        playback.activeCard?.hand === 'player' &&
                                        playback.activeCard.slot === i
                                            ? playback.activeCard.step
                                            : undefined
                                    }
                                />
                            </button>
                        </div>
                    ))}
                </div>
                {scenario.startsWith('card_order') && (
                    <output aria-label="Played path">{path.join(' → ')}</output>
                )}
                {g.winner !== 0 && (result || (!pinned && !pinnedStep && !playback.animating)) && (
                    <section className="modal" style={{ margin: '24px auto' }}>
                        <h2>{copy.title}</h2>
                        <p>{copy.body}</p>
                    </section>
                )}
            </main>
        </>
    );
}
createRoot(document.getElementById('root')!).render(<Preview />);
