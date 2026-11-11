export type Cell = { x: number; y: number };
export type Point = readonly [number, number];
type Edge = { start: Point; end: Point; direction: number; used: boolean };
const key = (x: number, y: number) => `${x},${y}`;

/** Trace the union of occupied cells. Shared edges disappear; holes and diagonal islands survive. */
export function traceTerrain(cells: readonly Cell[]): Point[][] {
    const occupied = new Set(cells.map(({ x, y }) => key(x, y)));
    const outgoing = new Map<string, Edge[]>();
    const edges: Edge[] = [];
    const add = (start: Point, end: Point, direction: number) => {
        const edge = { start, end, direction, used: false };
        edges.push(edge);
        const id = key(...start);
        outgoing.set(id, [...(outgoing.get(id) ?? []), edge]);
    };
    for (const id of occupied) {
        const [x, y] = id.split(',').map(Number);
        if (!occupied.has(key(x, y - 1))) add([x, y], [x + 1, y], 0);
        if (!occupied.has(key(x + 1, y))) add([x + 1, y], [x + 1, y + 1], 1);
        if (!occupied.has(key(x, y + 1))) add([x + 1, y + 1], [x, y + 1], 2);
        if (!occupied.has(key(x - 1, y))) add([x, y + 1], [x, y], 3);
    }
    const loops: Point[][] = [];
    for (const first of edges) {
        if (first.used) continue;
        const points: Point[] = [];
        let edge = first;
        while (!edge.used) {
            edge.used = true;
            points.push(edge.start);
            if (key(...edge.end) === key(...first.start)) break;
            const next = (outgoing.get(key(...edge.end)) ?? []).filter((e) => !e.used);
            // A right turn keeps corner-touching islands separate.
            const priority = (e: Edge) =>
                [1, 0, 3, 2].indexOf((e.direction - edge.direction + 4) % 4);
            next.sort((a, b) => priority(a) - priority(b));
            if (!next.length) throw Error('Terrain boundary is not closed');
            edge = next[0];
        }
        loops.push(points);
    }
    return loops;
}

export function terrainNoise(x: number, y: number, salt = 0): number {
    const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453;
    return n - Math.floor(n);
}

/** Rounded, gently uneven union contours in SVG pixels; no per-tile outlines. */
export function terrainPath(cells: readonly Cell[], radius = 7, wobble = 1.8): string {
    return traceTerrain(cells)
        .map((loop) => {
            const corners = loop.map(([x, y], i) => {
                const [px, py] = loop[(i + loop.length - 1) % loop.length];
                const [nx, ny] = loop[(i + 1) % loop.length];
                const cross = (x - px) * (ny - y) - (y - py) * (nx - x);
                const r = cross === 0 ? 0 : radius;
                return {
                    center: [x * 40, y * 40] as Point,
                    before: [x * 40 + (px - x) * r, y * 40 + (py - y) * r] as Point,
                    after: [x * 40 + (nx - x) * r, y * 40 + (ny - y) * r] as Point,
                };
            });
            let previous = corners[corners.length - 1].after;
            let d = `M${previous.join(',')}`;
            for (const { before, center, after } of corners) {
                const dx = before[0] - previous[0],
                    dy = before[1] - previous[1];
                const length = Math.hypot(dx, dy) || 1;
                const bend = (terrainNoise(center[0], center[1]) - 0.5) * wobble * 2;
                d += `Q${((previous[0] + before[0]) / 2 + (dy / length) * bend).toFixed(2)},${(
                    (previous[1] + before[1]) / 2 -
                    (dx / length) * bend
                ).toFixed(2)} ${before.join(',')}`;
                if (before[0] !== after[0] || before[1] !== after[1])
                    d += `Q${center.join(',')} ${after.join(',')}`;
                previous = after;
            }
            return `${d}Z`;
        })
        .join(' ');
}
