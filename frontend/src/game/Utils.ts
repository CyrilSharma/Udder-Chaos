//-----Tiles-----//
export const TileEnum = {
    Plain: 0,
    Pasture: 1,
    Impassible: 2,
    Destination: 3,
};
export type TileType = number;
export const TileMap: Record<number, string> = {};
Object.keys(TileEnum).forEach((key) => {
    const idx = TileEnum[key as keyof typeof TileEnum];
    TileMap[idx] = `raw-assets/${key.toLowerCase()}.png`;
});
export type Grid = TileType[][];

//-----Pieces-----//
export const PieceEnum = {
    Cow: 0,
    Player_Red: 1,
    Player_Green: 2,
    Player_Blue: 3,
    Player_Orange: 4,
    Enemy_Red: 5,
    Enemy_Green: 6,
    Enemy_Blue: 7,
    Enemy_Orange: 8
};
export type PieceType = number;
export const PieceMap: Record<number, string> = {};
Object.keys(PieceEnum).forEach((key) => {
    const idx = PieceEnum[key as keyof typeof PieceEnum];
    PieceMap[idx] = `raw-assets/${key.toLowerCase()}.png`;
});
export function isPlayer(piece_type: number) {
    for (const key of Object.keys(PieceEnum)) {
        const val = PieceEnum[key as keyof typeof PieceEnum];
        if (val != piece_type) continue;
        return key.toLowerCase().includes("player");
    };
    throw Error("Invalid Piece Type");
}

//----------Game-----------//
export type Position = {
    row: number,
    column: number
};
export type GameConfig = {
    grid: Grid,
    starts: Position[][];
    tileSize: number,
};
export type PieceUpdate = {

}
export type PieceMove = { from: Position, to: Position };
// We categorize the moves to allow for unique animations.
export type GameUpdate = {
    normal_moves: PieceMove[], // Moves which kill nothing.
    kill_moves:   PieceMove[], // Moves which kill a unit.
    score_moves:  PieceMove[]  // Moves which abduct a cow.
}


//-----Functions-----//
export function createRandomGrid(rows = 16, cols = 16) {
    const grid: Grid = [];
    const tiles = [
        TileEnum.Plain, TileEnum.Pasture,
        TileEnum.Impassible, TileEnum.Destination
    ];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let idx = Math.floor(Math.random() * tiles.length);
            if (!grid[r]) grid[r] = [];
            grid[r][c] = tiles[idx];
        }
    }
    return grid;
};