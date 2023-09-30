export const Tile = {
    Plain: 0,
    Pasture: 1,
    Impassible: 2,
    Destination: 3
}
export type Board = number[][];
export function createRandomBoard(rows = 16, cols = 16) {
    const board: Board = [];
    const types = [Tile.Plain, Tile.Pasture, Tile.Impassible, Tile.Destination];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let idx = Math.floor(Math.random() * types.length);
            board[r][c] = types[idx];
        }
    }
    return board;
}