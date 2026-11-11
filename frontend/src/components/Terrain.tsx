import { memo, useId, useMemo } from 'react';
import type { Respawn } from '../protocol';
import { Portal } from './Portal';
import { terrainNoise as noise, terrainPath, traceTerrain, type Cell } from './terrainGeometry';

const CREW_COLORS = ['#e94e40', '#f8cd37', '#4a91ee', '#a758ce'];

/** Terrain is presentation only: the Rust board still owns passability and cow regeneration. */
export const Terrain = memo(function Terrain({
    board,
    respawns,
}: {
    board: number[][];
    respawns: Respawn[];
}) {
    const id = useId().replace(/:/g, '');
    const width = board[0].length * 40,
        height = board.length * 40;
    const terrain = useMemo(() => {
        const pasture: Cell[] = [],
            rock: Cell[] = [],
            portals: Cell[] = [];
        const regrowing = new Set(respawns.map((r) => `${r.x},${r.y}`));
        board.forEach((row, y) =>
            row.forEach((tile, x) => {
                if (tile === 1 || (tile === 0 && regrowing.has(`${x},${y}`)))
                    pasture.push({ x, y });
                if (tile === 2) rock.push({ x, y });
                if (tile >= 7 && tile <= 10) portals.push({ x, y });
            }),
        );
        const mesh = new Set<string>();
        for (const { x, y } of rock) {
            for (let j = Math.floor((y * 40) / 32) - 1; j <= Math.ceil(((y + 1) * 40) / 32); j++) {
                for (
                    let i = Math.floor((x * 40) / 32) - 1;
                    i <= Math.ceil(((x + 1) * 40) / 32);
                    i++
                )
                    mesh.add(`${i},${j}`);
            }
        }
        const boundary = traceTerrain(rock).flatMap((loop) =>
            loop.map((p, i) => [p, loop[(i + 1) % loop.length]]),
        );
        const stone = new Set(rock.map((p) => `${p.x},${p.y}`));
        const vertex = (x: number, y: number) => {
            const px = x * 32 + (noise(x, y, 1) - 0.5) * 15,
                py = y * 32 + (noise(x, y, 2) - 0.5) * 15;
            let distance = 40;
            for (const [a, b] of boundary) {
                const ax = a[0] * 40,
                    ay = a[1] * 40,
                    dx = (b[0] - a[0]) * 40,
                    dy = (b[1] - a[1]) * 40;
                const t = Math.max(
                    0,
                    Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)),
                );
                distance = Math.min(distance, Math.hypot(px - ax - t * dx, py - ay - t * dy));
            }
            const z = stone.has(`${Math.floor(px / 40)},${Math.floor(py / 40)}`)
                ? distance * 1.7 + noise(x, y, 5) * 3
                : 0;
            return [px, py, z];
        };
        const facet = (a: number[], b: number[], c: number[]) => {
            const u = b.map((n, i) => n - a[i]),
                v = c.map((n, i) => n - a[i]);
            const nx = u[1] * v[2] - u[2] * v[1],
                ny = u[2] * v[0] - u[0] * v[2],
                nz = u[0] * v[1] - u[1] * v[0];
            const light =
                0.25 +
                0.75 * Math.max(0, (-0.45 * nx - 0.65 * ny + 0.6 * nz) / Math.hypot(nx, ny, nz));
            return {
                points: [a, b, c].map((p) => `${p[0]},${p[1]}`).join(' '),
                fill: `rgb(${Math.round(82 + light * 95)} ${Math.round(
                    91 + light * 84,
                )} ${Math.round(76 + light * 74)})`,
            };
        };
        const facets = [...mesh].flatMap((key) => {
            const [x, y] = key.split(',').map(Number);
            const a = vertex(x, y),
                b = vertex(x + 1, y),
                c = vertex(x + 1, y + 1),
                d = vertex(x, y + 1);
            return [facet(a, b, d), facet(b, c, d)];
        });
        const fringe = traceTerrain(pasture)
            .flatMap((loop) =>
                loop.flatMap((p, i) => {
                    const q = loop[(i + 1) % loop.length],
                        dx = q[0] - p[0],
                        dy = q[1] - p[1];
                    return [0.28, 0.5, 0.73].map((t, j) => {
                        const x = (p[0] + dx * t) * 40,
                            y = (p[1] + dy * t) * 40;
                        const reach = 3 + noise(x, y, j) * 4;
                        return `M${x - dx * 2 - dy},${y - dy * 2 + dx}Q${x + dy * reach - dx * 3},${
                            y - dx * reach - dy * 3
                        } ${x + dy * reach + dx},${y - dx * reach + dy}Q${x + dx * 2},${
                            y + dy * 2
                        } ${x + dx * 2 - dy},${y + dy * 2 + dx}Z`;
                    });
                }),
            )
            .join(' ');
        return {
            pasture: terrainPath(pasture, 9, 2.4),
            rock: terrainPath(rock, 6, 1.5),
            facets,
            fringe,
            pastureArea:
                `M0,0H${width}V${height}H0Z ` +
                portals.map(({ x, y }) => `M${x * 40},${y * 40}h40v40h-40Z`).join(' '),
        };
    }, [board, respawns, width, height]);
    return (
        <g className="terrain" aria-hidden="true" clipPath={`url(#field-${id})`}>
            <defs>
                <clipPath id={`field-${id}`}>
                    <rect width={width} height={height} />
                </clipPath>
                <clipPath id={`pasture-area-${id}`}>
                    <path d={terrain.pastureArea} fillRule="evenodd" clipRule="evenodd" />
                </clipPath>
                <clipPath id={`rock-${id}`}>
                    <path d={terrain.rock} fillRule="evenodd" clipRule="evenodd" />
                </clipPath>
                <clipPath id={`pasture-${id}`}>
                    <path d={terrain.pasture} fillRule="evenodd" clipRule="evenodd" />
                </clipPath>
                <pattern id={`grass-${id}`} width="113" height="97" patternUnits="userSpaceOnUse">
                    {Array.from({ length: 18 }, (_, i) => {
                        const x = noise(i, 1) * 113,
                            y = noise(i, 2) * 97;
                        return (
                            <path
                                key={i}
                                d={`M${x - 2},${y + 2}q2,-4 1,-6 M${x},${y + 1}q1,-3 4,-4`}
                                fill="none"
                                stroke="#527e35"
                                strokeWidth="1.1"
                                opacity=".22"
                                strokeLinecap="round"
                            />
                        );
                    })}
                </pattern>
            </defs>
            <rect width={width} height={height} fill="#a6cd65" />
            <g data-pasture-boundary="field-and-portals" clipPath={`url(#pasture-area-${id})`}>
                <path
                    data-terrain="pasture"
                    d={terrain.pasture}
                    fill="#397d3e"
                    stroke="#397d3e"
                    strokeWidth="5"
                    strokeLinejoin="round"
                    fillRule="evenodd"
                />
                <path d={terrain.fringe} fill="#397d3e" />
            </g>
            <rect width={width} height={height} fill={`url(#grass-${id})`} />
            <g clipPath={`url(#pasture-area-${id})`}>
                <g clipPath={`url(#pasture-${id})`} opacity=".38">
                    {board.flatMap((row, y) =>
                        row.map((_, x) => {
                            const px = x * 40 + noise(x, y, 8) * 30 + 5,
                                py = y * 40 + noise(x, y, 9) * 30 + 5;
                            return (
                                <path
                                    key={`${x},${y}`}
                                    d={`M${px - 3},${py + 2}q3,-5 2,-8 M${px},${py + 1}q1,-4 5,-5`}
                                    fill="none"
                                    stroke="#83b858"
                                    strokeWidth="1.5"
                                    strokeLinecap="round"
                                />
                            );
                        }),
                    )}
                </g>
            </g>
            <g data-terrain="ridge">
                <path
                    d={terrain.rock}
                    transform="translate(0,2)"
                    fill="#506442"
                    stroke="#506442"
                    strokeWidth="5"
                    fillRule="evenodd"
                    strokeLinejoin="round"
                />
                <path
                    d={terrain.rock}
                    fill="#849078"
                    stroke="#4c6047"
                    strokeWidth="2.5"
                    fillRule="evenodd"
                    strokeLinejoin="round"
                />
                <g clipPath={`url(#rock-${id})`}>
                    {terrain.facets.map((facet, i) => (
                        <polygon
                            key={i}
                            {...facet}
                            stroke="#cbd1b2"
                            strokeOpacity=".08"
                            strokeWidth=".7"
                        />
                    ))}
                </g>
            </g>
            <path
                d={Array.from(
                    { length: board[0].length - 1 },
                    (_, x) => `M${(x + 1) * 40},0V${height}`,
                )
                    .concat(
                        Array.from(
                            { length: board.length - 1 },
                            (_, y) => `M0,${(y + 1) * 40}H${width}`,
                        ),
                    )
                    .join(' ')}
                fill="none"
                stroke="#294a29"
                strokeOpacity=".16"
                strokeWidth=".7"
            />
            {board.flatMap((row, y) =>
                row.map(
                    (tile, x) =>
                        tile >= 7 &&
                        tile <= 10 && (
                            <Portal key={`${x},${y}`} x={x} y={y} color={CREW_COLORS[tile - 7]} />
                        ),
                ),
            )}
        </g>
    );
});
