import { assetUrl } from '../media';
import { useId, type CSSProperties } from 'react';
import { mothershipAngry, type Cinematic } from './cinematics';

// Crop only at render time; the generated transparent PNG stays intact.
const MOTHERSHIP_SOURCE = { width: 2172, height: 724, viewBox: '4 98 2165 516' };
export function MothershipScene({
    scene,
    width,
    height,
    layer,
}: {
    scene: Cinematic;
    width: number;
    height: number;
    layer: 'field' | 'sky';
}) {
    const motherWidth = width * 1.16;
    const motherHeight = (motherWidth * 516) / 2165;
    const id = useId().replace(/:/g, '');
    if (scene.kind === 'farmers_win') return null;
    const transport = scene.phase === 'beaming';
    const uplifting = scene.phase === 'uplifting';
    const angry = mothershipAngry(scene);
    const destruction = scene.phase === 'destroying';
    const beamShips = transport ? scene.ships.filter((_, i) => i < scene.cows) : scene.ships;
    const cows =
        transport && scene.ships.length > 0
            ? Array.from({ length: Math.min(scene.cows, 100) }, (_, i) => ({
                  ship: scene.ships[i % scene.ships.length],
                  i,
              }))
            : [];
    if (layer === 'field')
        return (
            <g className="cinematic-field">
                <defs>
                    <linearGradient
                        id={`beam-${id}`}
                        gradientUnits="userSpaceOnUse"
                        x1="0"
                        y1={height}
                        x2="0"
                        y2="-30"
                    >
                        <stop offset="0" stopColor="#a8f8ff" stopOpacity=".15" />
                        <stop offset="1" stopColor="#e3ffff" stopOpacity=".8" />
                    </linearGradient>
                </defs>
                {(transport || destruction || uplifting) &&
                    beamShips.map((ship, i) => {
                        const x = ship.x * 40 + 20,
                            y = ship.y * 40 + 17;
                        return (
                            <g
                                key={i}
                                className={destruction ? 'destruction-beam' : 'transport-beam'}
                            >
                                <line
                                    x1={x}
                                    y1={-30}
                                    x2={x}
                                    y2={y}
                                    stroke={destruction ? '#ff2929' : `url(#beam-${id})`}
                                    strokeWidth={destruction ? 5 : 15}
                                />
                                <line
                                    x1={x}
                                    y1={-30}
                                    x2={x}
                                    y2={y}
                                    stroke={destruction ? '#fff1b6' : '#eaffff'}
                                    strokeWidth={destruction ? 2 : 1}
                                    opacity=".85"
                                />
                                <ellipse
                                    cx={x}
                                    cy={y}
                                    rx="17"
                                    ry="7"
                                    fill="none"
                                    stroke={destruction ? '#ffdb5e' : '#c8ffff'}
                                    strokeWidth="2"
                                />
                            </g>
                        );
                    })}
                {cows.map(({ ship, i }) => (
                    <g key={i} transform={`translate(${ship.x * 40 + 20},${ship.y * 40 + 14})`}>
                        <image
                            className="beamed-cow"
                            href={assetUrl('/images/cow.png')}
                            x="-19"
                            y="-23"
                            width="38"
                            height="38"
                            style={
                                {
                                    '--beam-rise': `${-(ship.y * 40 + 65)}px`,
                                    animationDelay: `${i * 0.2}s`,
                                } as CSSProperties
                            }
                        />
                    </g>
                ))}
            </g>
        );
    return (
        <svg
            className={`cinematic-layer ${scene.kind} phase-${scene.phase}`}
            viewBox={`0 0 ${width} ${height}`}
            aria-hidden="true"
            data-cinematic-phase={scene.phase}
        >
            <g className={`mother-motion ${scene.phase}`}>
                {scene.kind === 'aliens_win' &&
                    [0.12, 0.3, 0.7, 0.88].map((x, i) => (
                        <g key={i} transform={`translate(${width * x},${-motherHeight * 0.55})`}>
                            <path
                                className="celebration-sparkle"
                                d="M0,-8L2,-2L8,0L2,2L0,8L-2,2L-8,0L-2,-2Z"
                                fill={i % 2 ? '#ffcc68' : '#e4ffef'}
                                style={{ animationDelay: `${i * 0.18}s` }}
                            />
                        </g>
                    ))}
                <svg
                    x={-width * 0.08}
                    y={-20 - motherHeight}
                    width={motherWidth}
                    height={motherHeight}
                    viewBox={MOTHERSHIP_SOURCE.viewBox}
                    preserveAspectRatio="xMidYMid meet"
                    className="mothership-image"
                >
                    <image
                        href={assetUrl('/images/characters/mothership-v1.png')}
                        width={MOTHERSHIP_SOURCE.width}
                        height={MOTHERSHIP_SOURCE.height}
                    />
                    <g
                        className={angry ? 'mothership-angry-face' : 'mothership-happy-face'}
                        fill="none"
                        stroke="#3e5474"
                        strokeWidth="12"
                        strokeLinecap="round"
                    >
                        <path
                            d={
                                angry
                                    ? 'M945,205L1008,228M1165,228L1228,205M960,242H994M1179,242H1213M1025,310Q1085,255 1145,310'
                                    : 'M945,235Q975,195 1005,235M1165,235Q1195,195 1225,235M1025,280Q1085,335 1145,280'
                            }
                        />
                        <circle
                            cx="950"
                            cy="275"
                            r="19"
                            fill={angry ? '#ec8a77' : '#f7a7ba'}
                            stroke="none"
                            opacity=".6"
                        />
                        <circle
                            cx="1220"
                            cy="275"
                            r="19"
                            fill={angry ? '#ec8a77' : '#f7a7ba'}
                            stroke="none"
                            opacity=".6"
                        />
                    </g>
                </svg>
                <ellipse
                    cx={width / 2}
                    cy={-25}
                    rx={width * 0.48}
                    ry="5"
                    className="mothership-receiver"
                />
            </g>
            {destruction &&
                scene.ships.map((p, i) => (
                    <g key={i} transform={`translate(${p.x * 40 + 20},${p.y * 40 + 20})`}>
                        <g className="ship-burst" style={{ animationDelay: `${i * 0.08}s` }}>
                            <path
                                d="M0-24 6-10 19-18 13-4 27 0 13 6 20 20 5 13 0 28-6 12-22 19-13 4-27 0-12-7-20-20-5-12Z"
                                fill="#ffd64d"
                                stroke="#f24b23"
                                strokeWidth="3"
                            />
                            <circle r="7" fill="#fff9d9" />
                        </g>
                    </g>
                ))}
        </svg>
    );
}
