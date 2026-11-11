import { test } from 'node:test';
import assert from 'node:assert/strict';
import { traceTerrain, terrainPath, type Point } from '../components/terrainGeometry.ts';
const area = (points: Point[]) =>
    points.reduce((a, p, i) => {
        const next = points[(i + 1) % points.length];
        return a + (p[0] * next[1] - next[0] * p[1]) / 2;
    }, 0);

test('adjacent blocked cells share one boundary with no interior edge', () => {
    const loops = traceTerrain([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
    ]);
    assert.equal(loops.length, 1);
    assert.equal(loops[0].length, 6);
    assert.equal(area(loops[0]), 2);
});
test('diagonal cells stay separate and a walkable hole stays open', () => {
    assert.equal(
        traceTerrain([
            { x: 0, y: 0 },
            { x: 1, y: 1 },
        ]).length,
        2,
    );
    const ring = Array.from({ length: 9 }, (_, i) => ({ x: i % 3, y: Math.floor(i / 3) })).filter(
        (p) => p.x !== 1 || p.y !== 1,
    );
    assert.deepEqual(
        traceTerrain(ring)
            .map(area)
            .sort((a, b) => a - b),
        [-1, 9],
    );
});
test('all 512 local tile arrangements preserve exactly the occupied area', () => {
    for (let mask = 0; mask < 512; mask++) {
        const cells = Array.from({ length: 9 }, (_, i) => ({
            x: i % 3,
            y: Math.floor(i / 3),
        })).filter((_, i) => mask & (1 << i));
        assert.equal(
            traceTerrain(cells).reduce((sum, loop) => sum + area(loop), 0),
            cells.length,
            `mask ${mask}`,
        );
    }
});
test('empty, isolated and board-edge contours produce finite closed SVG paths', () => {
    assert.equal(terrainPath([]), '');
    const cells = [
        { x: 0, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 },
    ];
    const path = terrainPath(cells);
    assert.ok(path.startsWith('M') && path.endsWith('Z'));
    assert.ok(!/NaN|Infinity/.test(path));
    assert.equal(terrainPath(cells), path);
});
