import { UfoPurchaseButton } from './components/UfoPurchaseButton';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import type { Command, Move, Reply, Settings, Snapshot } from './protocol';
import './style.css';
import { assetUrl, audioSource, warmMedia } from './media';
import { COLORS } from './presentation';
import { peerClient } from './multiplayer/client';
import { Card } from './components/Card';
import { AvailableRooms } from './components/AvailableRooms';
import { Board } from './components/Board';
import { useGamePlayback } from './components/useGamePlayback';
import { displayedTurnIsCurrent } from './components/cardPlayback';
import { endingCopy } from './components/cinematics';
import { useCardMotion } from './components/useCardMotion';
import { useCardPreview } from './components/useCardPreview';
import { useMusic } from './components/useMusic';
import { useGameSounds } from './components/useGameSounds';
const defaults: Settings = {
    seed: 0,
    map_id: 0,
    card_deck_size: 15,
    timer_length: 30,
    difficulty: 1000,
    threads: 1,
    rules: {
        hand_size: 3,
        cow_sacrifice: 5,
        cow_regen_rate: 15,
        days_per_round: 5,
        score_goal: 10,
    },
};
type Session = { room: string; token: string };
function readSession(): Session | null {
    try {
        return JSON.parse(sessionStorage.getItem('udder-session') || 'null');
    } catch {
        return null;
    }
}
function readPreferredName(): string {
    const saved = (localStorage.getItem('udder-name') || '').trim();
    if (saved === 'Space Cowboy') return '';
    const oldColor = COLORS.find((color) => saved === `${color} crew`);
    const normalized = oldColor ?? saved;
    if (
        COLORS.some((color) => color === normalized) &&
        localStorage.getItem('udder-name-custom') !== '1'
    )
        return '';
    return normalized;
}

const request = (command: Command): Promise<Reply> => peerClient.request(command);
warmMedia();
function App() {
    const silentPreview = new URLSearchParams(location.search).get('muted') === '1';
    const cardRoot = useCardMotion();
    const [session, setSession] = useState<Session | null>(readSession);
    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [screen, setScreen] = useState<'home' | 'join' | 'settings'>('home');
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            return JSON.parse(sessionStorage.getItem('udder-settings') || 'null') ?? defaults;
        } catch {
            return defaults;
        }
    });
    useEffect(() => {
        sessionStorage.setItem('udder-settings', JSON.stringify(settings));
    }, [settings]);
    const [name, setName] = useState(readPreferredName);
    const [rejoinNeedsName, setRejoinNeedsName] = useState(false);
    const [rejoinName, setRejoinName] = useState(readPreferredName);
    const [room, setRoom] = useState('');
    const [error, setError] = useState('');
    const [pending, setPending] = useState(false);
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);
    const [paused, setPaused] = useState(false);
    const playback = useGamePlayback(snapshot);
    const animating = playback.animating;
    const [now, setNow] = useState(Date.now());
    const [music, setMusic] = useState(Number(localStorage.getItem('udder-music') ?? 0.3));
    const [sound, setSound] = useState(Number(localStorage.getItem('udder-sound') ?? 0.5));
    const effectVolume = useRef(0);
    effectVolume.current = silentPreview ? 0 : sound;
    const busy = useRef(false);
    const nameSave = useRef<Promise<void> | null>(null);
    const generation = useRef(0);
    const accept = useCallback((reply: Reply) => {
        if (reply.error) {
            setError(reply.error);
            return;
        }
        if (reply.snapshot) {
            setSnapshot((previous) =>
                previous &&
                reply.snapshot &&
                previous.room === reply.snapshot.room &&
                previous.revision > reply.snapshot.revision
                    ? previous
                    : reply.snapshot,
            );
            setSettings(reply.snapshot.settings);
            if (reply.token) {
                const s = { room: reply.snapshot.room, token: reply.token };
                sessionStorage.setItem('udder-session', JSON.stringify(s));
                setSession(s);
            }
        }
    }, []);
    useEffect(() => {
        if (!session) return;
        let disposed = false;
        const gen = generation.current;
        let timer: ReturnType<typeof setTimeout>;
        const poll = async () => {
            try {
                const reply = await request({ type: 'get', ...session });
                if (disposed || gen !== generation.current) return;
                if (reply.error) {
                    setError(reply.error);
                    if (reply.error === 'Room not found' || reply.error === 'Invalid session') {
                        setSession(null);
                        setSnapshot(null);
                        sessionStorage.removeItem('udder-session');
                    }
                } else {
                    setSnapshot((previous) =>
                        previous &&
                        reply.snapshot &&
                        previous.room === reply.snapshot.room &&
                        previous.revision > reply.snapshot.revision
                            ? previous
                            : reply.snapshot,
                    );
                    setError('');
                }
            } catch {
                if (!disposed) setError('Connection lost. Reconnecting…');
            }
            if (!disposed) timer = setTimeout(poll, 500);
        };
        void poll();
        return () => {
            disposed = true;
            clearTimeout(timer);
        };
    }, [session]);
    useEffect(() => {
        const i = setInterval(() => setNow(Date.now()), 200);
        return () => clearInterval(i);
    }, []);
    useEffect(() => {
        const player = snapshot?.players.find((player) => player.color === snapshot.you);
        if (player) {
            setName(player.name);
            localStorage.setItem('udder-name', player.name);
        }
    }, [snapshot?.room, snapshot?.you]);
    const editName = (value: string) => {
        setName(value);
        localStorage.setItem('udder-name', value);
        localStorage.setItem('udder-name-custom', '1');
    };
    const playSound = (file: string) => {
        if (sound > 0 && !silentPreview) {
            void audioSource(assetUrl(`/sounds/sound-effects/${file}`))
                .then((source) => {
                    if (effectVolume.current <= 0) return;
                    const a = new Audio(source);
                    a.volume = effectVolume.current;
                    return a.play();
                })
                .catch(() => {});
        }
    };
    const send = async (c: Command) => {
        if (busy.current) return;
        busy.current = true;
        setPending(true);
        setError('');
        const gen = generation.current;
        try {
            const r = await request(c);
            if (
                (c.type === 'join' || c.type === 'rejoin') &&
                r.error === 'Enter your name to rejoin'
            ) {
                setRejoinNeedsName(true);
                setError('');
                return;
            }
            if (gen === generation.current) accept(r);
            if (c.type === 'move' && !r.error) {
                playSound(c.action.type === 'buy' ? 'ufo-purchased.ogg' : 'card-play.ogg');
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not reach the server');
        } finally {
            busy.current = false;
            setPending(false);
        }
    };
    const leave = async () => {
        if (session) await send({ type: 'leave', ...session });
        generation.current++;
        sessionStorage.removeItem('udder-session');
        setSession(null);
        setSnapshot(null);
        setScreen('home');
        setName(readPreferredName());
        setPaused(false);
    };
    const musicTrack = snapshot?.game ? 'game' : snapshot ? 'lobby' : 'menu';
    useMusic(musicTrack, silentPreview ? 0 : music, cardRoot);
    useGameSounds(playback.game, playback.scene, sound, silentPreview, snapshot?.room ?? null);
    const g = playback.game ?? snapshot?.game;
    const yourTurn =
        !animating &&
        peerClient.ready() &&
        displayedTurnIsCurrent(g, snapshot?.game) &&
        !!g &&
        g.winner === 0 &&
        g.turn % 3 !== 2 &&
        (snapshot?.solo || g.player_id === snapshot?.you);
    const cardPreview = useCardPreview(
        session,
        snapshot?.revision,
        hoveredCard,
        !!yourTurn && !pending && !paused,
    );
    const move = (action: Move) => {
        if (session && snapshot)
            void send({ type: 'move', ...session, revision: snapshot.revision, action });
    };
    const options = (
        <div className="options">
            <label>
                Seed
                <input
                    type="number"
                    min="0"
                    max="4294967295"
                    value={settings.seed}
                    onChange={(e) => setSettings({ ...settings, seed: Number(e.target.value) })}
                />
            </label>
            <label>
                Map
                <select
                    value={settings.map_id}
                    onChange={(e) => setSettings({ ...settings, map_id: Number(e.target.value) })}
                >
                    {[0, 1, 2].map((i) => (
                        <option key={i} value={i}>
                            Pasture {i + 1}
                        </option>
                    ))}
                </select>
            </label>
            {(
                [
                    ['card_deck_size', 'Deck size', 7, 64],
                    ['timer_length', 'Turn timer (seconds)', 5, 300],
                    ['difficulty', 'AI time budget (ms)', 50, 3000],
                    ['threads', 'AI search workers', 1, 16],
                ] as const
            ).map(([key, label, min, max]) => (
                <label key={key}>
                    {label}
                    <input
                        type="number"
                        min={min}
                        max={max}
                        value={settings[key]}
                        onChange={(e) =>
                            setSettings({ ...settings, [key]: Number(e.target.value) })
                        }
                    />
                </label>
            ))}
            {(
                [
                    ['score_goal', 'Cows to win', 1, 100],
                    ['days_per_round', 'Days per round', 1, 50],
                    ['cow_sacrifice', 'Cows per sacrifice', 0, 100],
                    ['cow_regen_rate', 'Cow respawn (turns)', 1, 100],
                ] as const
            ).map(([key, label, min, max]) => (
                <label key={key}>
                    {label}
                    <input
                        type="number"
                        min={min}
                        max={max}
                        value={settings.rules[key]}
                        onChange={(e) =>
                            setSettings({
                                ...settings,
                                rules: { ...settings.rules, [key]: Number(e.target.value) },
                            })
                        }
                    />
                </label>
            ))}
        </div>
    );
    return (
        <div
            className={`app ${!snapshot && screen === 'home' ? 'app-home' : ''}`}
            ref={cardRoot}
            data-audio-muted={silentPreview}
            data-peer-host={snapshot?.host ?? false}
            data-engine-turn={snapshot?.game?.turn ?? -1}
        >
            <header className="topbar">
                <button
                    className="wordmark"
                    onClick={() => {
                        if (!session) setScreen('home');
                    }}
                >
                    <img className="brand-ufo" src={assetUrl('/images/player_red.png')} alt="" />
                    UDDER CHAOS
                </button>
                <div className="top-meta">
                    <span className="status-dot" />
                    {snapshot ? `ROOM ${snapshot.room}` : 'Not in a room'}
                    <button
                        className="quiet"
                        onClick={() => {
                            setScreen('settings');
                            setPaused(!!snapshot);
                        }}
                    >
                        Settings
                    </button>
                </div>
            </header>
            {error && (
                <div role="alert" className="error">
                    {error}
                    <button aria-label="Dismiss error" onClick={() => setError('')}>
                        ×
                    </button>
                </div>
            )}
            {!snapshot && (
                <main className="landing">
                    <section className="intro">
                        <div className="hero-art">
                            <svg
                                className="original-logo"
                                viewBox="397 334 1251 1375"
                                role="img"
                                aria-label="Udder Chaos: A Cow Caper"
                            >
                                <image
                                    href={assetUrl('/images/LOGO.png')}
                                    width="2048"
                                    height="2048"
                                />
                            </svg>
                        </div>
                    </section>
                    <section className="menu-panel">
                        {screen === 'home' && (
                            <>
                                <button
                                    className="primary"
                                    disabled={pending}
                                    onClick={() =>
                                        void send({
                                            type: 'create',
                                            name: readPreferredName(),
                                            solo: false,
                                            settings,
                                        })
                                    }
                                >
                                    Create room <span>＋</span>
                                </button>
                                <button disabled={pending} onClick={() => setScreen('join')}>
                                    Join room <span>→</span>
                                </button>
                            </>
                        )}
                        {screen === 'join' && (
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    void send(
                                        rejoinNeedsName
                                            ? {
                                                  type: 'rejoin',
                                                  room,
                                                  name: rejoinName,
                                              }
                                            : {
                                                  type: 'join',
                                                  room,
                                                  name: readPreferredName(),
                                                  token: null,
                                              },
                                    );
                                }}
                            >
                                <h2>Join a room</h2>
                                <label>
                                    Room code
                                    <input
                                        autoCapitalize="characters"
                                        maxLength={6}
                                        required
                                        value={room}
                                        onChange={(e) => {
                                            setRoom(e.target.value.toUpperCase());
                                            setRejoinNeedsName(false);
                                        }}
                                    />
                                </label>
                                {rejoinNeedsName && (
                                    <label>
                                        Your name
                                        <input
                                            required
                                            maxLength={24}
                                            autoComplete="nickname"
                                            value={rejoinName}
                                            onChange={(e) => setRejoinName(e.target.value)}
                                        />
                                    </label>
                                )}
                                <button className="primary" disabled={pending}>
                                    Join room →
                                </button>
                                {!rejoinNeedsName && (
                                    <AvailableRooms
                                        disabled={pending}
                                        onJoin={(code) => {
                                            setRoom(code);
                                            void send({
                                                type: 'join',
                                                room: code,
                                                name: readPreferredName(),
                                                token: null,
                                            });
                                        }}
                                    />
                                )}
                                <button
                                    type="button"
                                    className="quiet"
                                    onClick={() => setScreen('home')}
                                >
                                    ← Back
                                </button>
                            </form>
                        )}
                        {screen === 'settings' && (
                            <>
                                <h2>Set the mood.</h2>
                                <label>
                                    Music volume
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={music}
                                        onChange={(e) => {
                                            const v = Number(e.target.value);
                                            setMusic(v);
                                            localStorage.setItem('udder-music', String(v));
                                        }}
                                    />
                                </label>
                                <label>
                                    Sound effects
                                    <input
                                        type="range"
                                        min="0"
                                        max="1"
                                        step="0.05"
                                        value={sound}
                                        onChange={(e) => {
                                            const v = Number(e.target.value);
                                            setSound(v);
                                            localStorage.setItem('udder-sound', String(v));
                                        }}
                                    />
                                </label>
                                <button className="quiet" onClick={() => setScreen('home')}>
                                    ← Back
                                </button>
                            </>
                        )}
                    </section>
                </main>
            )}
            {snapshot && !g && (
                <main className="lobby">
                    <h1>
                        Meet at <em>{snapshot.room}.</em>
                    </h1>
                    <div className="crew-list">
                        {[...snapshot.players]
                            .sort(
                                (a, b) =>
                                    Number(b.color === snapshot.you) -
                                    Number(a.color === snapshot.you),
                            )
                            .map((p) => (
                                <div className={`crew-member crew-${p.color}`} key={p.color}>
                                    <span className={`crew-icon c${p.color}`}>◈</span>
                                    {p.color === snapshot.you ? (
                                        <input
                                            className="crew-name"
                                            aria-label="Your name"
                                            maxLength={24}
                                            value={name}
                                            disabled={pending && !nameSave.current}
                                            onChange={(e) => editName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Escape') {
                                                    e.currentTarget.value = p.name;
                                                    setName(p.name);
                                                    e.currentTarget.blur();
                                                }
                                                if (e.key === 'Enter') e.currentTarget.blur();
                                            }}
                                            onBlur={(e) => {
                                                const next = e.currentTarget.value.trim();
                                                if (!next) {
                                                    setName(p.name);
                                                    return;
                                                }
                                                setName(next);
                                                if (session && next !== p.name) {
                                                    const saving = send({
                                                        type: 'configure',
                                                        ...session,
                                                        name: next,
                                                        color: snapshot.you,
                                                        settings: null,
                                                        solo: null,
                                                    });
                                                    nameSave.current = saving;
                                                    void saving.finally(() => {
                                                        if (nameSave.current === saving)
                                                            nameSave.current = null;
                                                    });
                                                }
                                            }}
                                        />
                                    ) : (
                                        <strong className="crew-name">{p.name}</strong>
                                    )}
                                    <span className="crew-label">
                                        {COLORS[p.color]} {p.color === snapshot.you ? '· You' : ''}
                                    </span>
                                    <small className="crew-status">
                                        {p.connected ? 'Connected' : 'Away'}
                                    </small>
                                </div>
                            ))}
                    </div>
                    {snapshot.host && (
                        <button
                            type="button"
                            className="solo-switch"
                            role="switch"
                            aria-checked={snapshot.solo}
                            disabled={pending || snapshot.players.length > 1}
                            onClick={async () => {
                                await nameSave.current;
                                if (session)
                                    void send({
                                        type: 'configure',
                                        ...session,
                                        name,
                                        color: snapshot.you,
                                        settings: null,
                                        solo: !snapshot.solo,
                                    });
                            }}
                        >
                            <span>Solo</span>
                            <span className="switch-track" aria-hidden="true">
                                <span />
                            </span>
                        </button>
                    )}
                    {snapshot.host && (
                        <details className="mission-settings">
                            <summary>Mission settings</summary>
                            {options}
                            <button
                                disabled={pending}
                                onClick={() =>
                                    session &&
                                    void send({
                                        type: 'configure',
                                        ...session,
                                        name,
                                        color: snapshot.you,
                                        settings,
                                        solo: null,
                                    })
                                }
                            >
                                Save settings
                            </button>
                        </details>
                    )}
                    <div className="lobby-actions">
                        {snapshot.host ? (
                            <button
                                className="primary"
                                disabled={
                                    (pending && !nameSave.current) ||
                                    (!snapshot.solo && snapshot.players.length !== 4)
                                }
                                onClick={async () => {
                                    await nameSave.current;
                                    if (session) void send({ type: 'start', ...session });
                                }}
                            >
                                Start
                            </button>
                        ) : (
                            <p>Waiting for the host to launch…</p>
                        )}
                        <button onClick={() => void leave()}>Leave room</button>
                    </div>
                </main>
            )}
            {snapshot && !g && paused && (
                <div className="modal-backdrop">
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-label="Audio settings"
                        className="modal"
                    >
                        <h2>Set the mood.</h2>
                        <label>
                            Music volume
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={music}
                                onChange={(e) => {
                                    setMusic(Number(e.target.value));
                                    localStorage.setItem('udder-music', e.target.value);
                                }}
                            />
                        </label>
                        <label>
                            Sound effects
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={sound}
                                onChange={(e) => {
                                    setSound(Number(e.target.value));
                                    localStorage.setItem('udder-sound', e.target.value);
                                }}
                            />
                        </label>
                        <button className="primary" onClick={() => setPaused(false)}>
                            Back to room
                        </button>
                    </section>
                </div>
            )}
            {g && snapshot && (
                <main className="game-layout">
                    <aside className="crew-sidebar">
                        <div className="eyebrow">PLAYERS</div>
                        {COLORS.map((c, i) => (
                            <div
                                key={c}
                                className={`crew-row crew-${i} ${
                                    g.turn % 3 !== 2 && g.player_id === i ? 'active' : ''
                                }`}
                            >
                                <span className={`crew-icon c${i}`}>◈</span>
                                <div>
                                    <strong>
                                        {snapshot.players.find((p) => p.color === i)?.name || c}
                                    </strong>
                                    <small>
                                        {playback.endingResolved
                                            ? 0
                                            : g.pieces.filter((p) => p.kind === i + 1).length}{' '}
                                        UFOs · {c}
                                    </small>
                                </div>
                            </div>
                        ))}
                        <div className="score-box">
                            <div className="eyebrow">COWS BANKED</div>
                            <strong>
                                {g.cows_collected}
                                <small> / {g.rules.score_goal}</small>
                            </strong>
                            <progress value={g.cows_collected} max={g.rules.score_goal} />
                        </div>
                        <div className="round-box">
                            <strong>
                                Day {(Math.floor(g.turn / 6) % g.rules.days_per_round) + 1} /{' '}
                                {g.rules.days_per_round}
                            </strong>
                            <p>Sacrifice {g.rules.cow_sacrifice} cows at round end</p>
                        </div>
                        <UfoPurchaseButton game={g} disabled={!yourTurn || pending} onBuy={move} />
                        <button
                            className="quiet"
                            onClick={() => {
                                setPaused(true);
                                setScreen('home');
                            }}
                        >
                            Pause menu
                        </button>
                    </aside>
                    <section className="play-area">
                        <div className="turn-status">
                            <div className="eyebrow">
                                {g.turn % 3 === 2 ? 'FARMER PATROL' : `TURN ${g.turn + 1}`}
                            </div>
                            <span className="turn-clock" aria-label="Seconds remaining">
                                {g.turn % 3 === 2
                                    ? '✥'
                                    : `${Math.max(
                                          0,
                                          Math.ceil((snapshot.turn_deadline_ms - now) / 1000),
                                      )}s`}
                            </span>
                        </div>
                        <Board
                            game={g}
                            preview={cardPreview}
                            scene={playback.scene}
                            endingResolved={playback.endingResolved}
                        />
                        <div className="hand-label">
                            <span>SHARED ALIEN HAND</span>
                            <span>
                                {yourTurn
                                    ? 'Play a card, or rotate to plan ahead.'
                                    : 'Waiting for other players…'}
                            </span>
                        </div>
                        <div
                            className={`hand crew-${g.player_id} ${
                                g.turn % 3 === 2 || g.winner !== 0 ? 'farmer-turn' : ''
                            }`}
                        >
                            {g.deck.player.map((id, card) => (
                                <div className="hand-card" key={card}>
                                    <button
                                        className="play-card"
                                        data-card-id={id}
                                        onMouseEnter={() => setHoveredCard(card)}
                                        onMouseLeave={() => setHoveredCard(null)}
                                        onFocus={() => setHoveredCard(card)}
                                        onBlur={() => setHoveredCard(null)}
                                        aria-label={`Play card ${card + 1}`}
                                        disabled={!yourTurn || pending}
                                        onClick={() =>
                                            move({ type: 'play', card, color: g.player_id })
                                        }
                                    >
                                        <span className="card-number">0{card + 1}</span>
                                        <Card
                                            dirs={g.deck.cards[id]}
                                            activeStep={
                                                playback.activeCard?.hand === 'player' &&
                                                playback.activeCard.slot === card
                                                    ? playback.activeCard.step
                                                    : undefined
                                            }
                                        />
                                        <span className="card-footer">PLAY CARD ↗</span>
                                    </button>
                                    <div
                                        className="rotate-controls"
                                        role="group"
                                        aria-label={`Rotate card ${card + 1}`}
                                    >
                                        {[
                                            {
                                                rotation: 3,
                                                label: '↺',
                                                description: '90° counterclockwise',
                                            },
                                            { rotation: 2, label: '180°', description: '180°' },
                                            {
                                                rotation: 1,
                                                label: '↻',
                                                description: '90° clockwise',
                                            },
                                        ].map(({ rotation, label, description }) => (
                                            <button
                                                key={rotation}
                                                className="rotate-card"
                                                aria-label={`Rotate card ${
                                                    card + 1
                                                } ${description}`}
                                                title={`${description} · uses turn`}
                                                disabled={!yourTurn || pending}
                                                onClick={() =>
                                                    move({ type: 'rotate', card, rotation })
                                                }
                                            >
                                                {label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    <aside className="deck-sidebar">
                        <div className="queue" aria-label="Card queue">
                            {g.deck.queue.map((_, index) => {
                                const id =
                                    g.deck.queue[(g.deck.cursor + index) % g.deck.queue.length];
                                return (
                                    <div
                                        key={id}
                                        data-card-id={id}
                                        className={index === 0 ? 'next-card' : ''}
                                    >
                                        <small>{index + 1}</small>
                                        <Card dirs={g.deck.cards[id]} />
                                    </div>
                                );
                            })}
                        </div>
                        <div className="eyebrow">FARMER HAND</div>
                        <div className={`farmer-hand ${g.turn % 3 === 2 ? 'current-farmers' : ''}`}>
                            {g.deck.enemy.map((id, card) => (
                                <div key={id} data-card-id={id}>
                                    <Card
                                        dirs={g.deck.cards[id]}
                                        activeStep={
                                            playback.activeCard?.hand === 'enemy' &&
                                            playback.activeCard.slot === card
                                                ? playback.activeCard.step
                                                : undefined
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </aside>
                    {(paused || (g.winner !== 0 && !animating)) && (
                        <div className="modal-backdrop">
                            <section
                                role="dialog"
                                aria-modal="true"
                                aria-labelledby="dialog-title"
                                className="modal"
                            >
                                <h2 id="dialog-title">
                                    {g.winner !== 0
                                        ? endingCopy(g).title
                                        : screen === 'settings'
                                        ? 'Set the mood.'
                                        : 'Taking a breather?'}
                                </h2>
                                {g.winner !== 0 ? (
                                    <p>{endingCopy(g).body}</p>
                                ) : screen === 'settings' ? (
                                    <>
                                        <label>
                                            Music
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.05"
                                                value={music}
                                                onChange={(e) => {
                                                    setMusic(Number(e.target.value));
                                                    localStorage.setItem(
                                                        'udder-music',
                                                        e.target.value,
                                                    );
                                                }}
                                            />
                                        </label>
                                        <label>
                                            Effects
                                            <input
                                                type="range"
                                                min="0"
                                                max="1"
                                                step="0.05"
                                                value={sound}
                                                onChange={(e) => {
                                                    setSound(Number(e.target.value));
                                                    localStorage.setItem(
                                                        'udder-sound',
                                                        e.target.value,
                                                    );
                                                }}
                                            />
                                        </label>
                                    </>
                                ) : (
                                    <p>The game clock keeps running.</p>
                                )}
                                {g.winner === 0 && (
                                    <>
                                        <button
                                            className="primary"
                                            onClick={() => setPaused(false)}
                                        >
                                            Return to the caper
                                        </button>
                                        <button onClick={() => setScreen('settings')}>
                                            Settings
                                        </button>
                                    </>
                                )}
                                <button className="quiet" onClick={() => void leave()}>
                                    Exit to main menu
                                </button>
                            </section>
                        </div>
                    )}
                </main>
            )}
            <footer className="site-footer">
                <span>UDDER CHAOS © 2023–2026</span>
                <span>
                    Music by Eric Matyas ·{' '}
                    <a href="https://soundimage.org/" target="_blank" rel="noreferrer">
                        soundimage.org
                    </a>
                </span>
            </footer>
        </div>
    );
}
createRoot(document.getElementById('root')!).render(<App />);
