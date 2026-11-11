import { assetUrl } from '../media';
import type { CSSProperties } from 'react';
import { MothershipScene } from './MothershipScene';
import type { Cinematic, EndingResolved } from './cinematics';
import type { CardPreview, GameView } from '../protocol';
import { RoutePreview } from './RoutePreview';
import { COLORS } from '../presentation';
import { Terrain } from './Terrain';
import { StepEffects } from './CaptureEffects';
import { stepDuration } from './stepTiming';
export function Board({
    game,
    scene = null,
    endingResolved = null,
    preview = null,
}: {
    game: GameView;
    preview?: CardPreview | null;
    scene?: Cinematic | null;
    endingResolved?: EndingResolved;
}) {
    const ordinals = Array(9).fill(0) as number[];
    const events = game.events ?? [];
    return (
        <div className="board-wrap">
            <div className="board-scene">
                <svg
                    className="board"
                    style={{ aspectRatio: `${game.board[0].length} / ${game.board.length}` }}
                    viewBox={`0 0 ${game.board[0].length * 40} ${game.board.length * 40}`}
                    role="img"
                    aria-label="Game board: alien ships, farmers and cows"
                >
                    <Terrain board={game.board} respawns={game.respawns} />
                    {preview && (
                        <RoutePreview
                            preview={preview}
                            width={game.board[0].length * 40}
                            height={game.board.length * 40}
                        />
                    )}
                    {game.board.flatMap((row, y) =>
                        row.map((tile, x) => {
                            return (
                                <g key={`${x}:${y}`} transform={`translate(${x * 40},${y * 40})`}>
                                    {tile === 1 && (
                                        <g className="music-bop cow-bop">
                                            <image
                                                href={assetUrl('/images/cow.png')}
                                                x="0"
                                                y="0"
                                                width="40"
                                                height="40"
                                            />
                                        </g>
                                    )}
                                </g>
                            );
                        }),
                    )}
                    {game.respawns.map((r) => (
                        <text
                            key={`${r.x}:${r.y}`}
                            x={r.x * 40 + 20}
                            y={r.y * 40 + 26}
                            fill="#e4edc5"
                            fontSize="12"
                            textAnchor="middle"
                        >
                            {Math.max(0, r.turn - game.turn)}
                        </text>
                    ))}
                    <StepEffects events={events} layer="behind" />
                    {scene && (
                        <MothershipScene
                            layer="field"
                            scene={scene}
                            width={game.board[0].length * 40}
                            height={game.board.length * 40}
                        />
                    )}

                    {game.pieces.map((p) => {
                        const depositing = events.find(
                            (e) =>
                                e.type === 'cow_deposited' &&
                                e.x === p.x &&
                                e.y === p.y &&
                                e.kind === p.kind,
                        );
                        const takingCow = events.some(
                            (e) =>
                                e.type === 'cow_abducted' &&
                                e.x === p.x &&
                                e.y === p.y &&
                                e.kind === p.kind,
                        );
                        const jabbing = events.some(
                            (e) =>
                                e.type === 'ufo_popped' &&
                                e.x === p.x &&
                                e.y === p.y &&
                                e.farmer_kind === p.kind,
                        );
                        const key = `${p.kind}:${ordinals[p.kind]++}`;
                        return (
                            <g
                                key={key}
                                className="piece"
                                style={{ transform: `translate(${p.x * 40}px,${p.y * 40}px)` }}
                            >
                                <title>
                                    {p.kind <= 4 ? 'UFO' : 'Farmer'} · {COLORS[(p.kind - 1) % 4]} ·{' '}
                                    {p.score} cows
                                </title>
                                <g
                                    key={`${p.x}:${p.y}:${
                                        takingCow
                                            ? 'abduct'
                                            : depositing
                                            ? 'deposit'
                                            : jabbing
                                            ? 'jab'
                                            : 'idle'
                                    }`}
                                    className={`unit-visual ${
                                        p.kind <= 4
                                            ? endingResolved === 'crashed'
                                                ? 'ship-wreck'
                                                : endingResolved
                                                ? 'ship-resolved'
                                                : scene?.phase === 'panic'
                                                ? 'ship-panic'
                                                : scene?.phase === 'crashing'
                                                ? 'ship-crash'
                                                : scene?.phase === 'uplifting'
                                                ? 'ship-uplift'
                                                : scene?.phase === 'destroying'
                                                ? 'ship-destroy'
                                                : takingCow
                                                ? 'ship-abduct'
                                                : depositing
                                                ? 'ship-deposit'
                                                : ''
                                            : jabbing
                                            ? 'farmer-unit farmer-jab'
                                            : 'farmer-unit'
                                    }`}
                                    style={
                                        {
                                            '--deposit-duration': `${stepDuration(
                                                depositing ? [depositing] : [],
                                            )}ms`,
                                            '--uplift-distance': `${-(p.y * 40 + 45)}px`,
                                        } as CSSProperties
                                    }
                                >
                                    <g className="music-bop">
                                        {p.kind <= 4 ? (
                                            <image
                                                href={assetUrl(
                                                    `/images/player_${COLORS[
                                                        p.kind - 1
                                                    ].toLowerCase()}.png`,
                                                )}
                                                x="0"
                                                y="0"
                                                width="40"
                                                height="40"
                                            />
                                        ) : (
                                            <svg
                                                x="0"
                                                y="0"
                                                width="40"
                                                height="40"
                                                viewBox={`${((p.kind - 5) % 2) * 100} ${
                                                    Math.floor((p.kind - 5) / 2) * 100
                                                } 100 100`}
                                                overflow="hidden"
                                            >
                                                <image
                                                    href={assetUrl(
                                                        '/images/characters/farmers-v1.png',
                                                    )}
                                                    width="200"
                                                    height="200"
                                                />
                                            </svg>
                                        )}
                                    </g>
                                    {p.score > 0 && (
                                        <>
                                            <circle cx="32" cy="8" r="8" fill="#f5e7af" />
                                            <text
                                                x="32"
                                                y="12"
                                                textAnchor="middle"
                                                fontSize="11"
                                                fill="#182c22"
                                            >
                                                {p.score}
                                            </text>
                                        </>
                                    )}
                                </g>
                            </g>
                        );
                    })}
                    <StepEffects events={events} layer="front" />
                </svg>
                {scene && (
                    <MothershipScene
                        layer="sky"
                        scene={scene}
                        width={game.board[0].length * 40}
                        height={game.board.length * 40}
                    />
                )}
            </div>
        </div>
    );
}
