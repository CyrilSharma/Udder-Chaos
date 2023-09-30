//-----Types-----//
export const TileEnum = {
    Plain: 0,
    Pasture: 1,
    Impassible: 2,
    Destination: 3,
};
export type TileType = number;
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
export const TypeMap: Record<number,string> = {
    0: "raw-assets/cow.png",
    1: "raw-assets/red_ufo.png",
    2: "raw-assets/green_ufo.png",
    3: "raw-assets/blue_ufo.png",
    4: "raw-assets/orange_ufo.png",
    5: "raw-assets/red_plane.png",
    6: "raw-assets/green_plane.png",
    7: "raw-assets/blue_plane.png",
    8: "raw-assets/orange_plane.png",
};
export type Grid = TileType[][];
export type Position = {
    row: number,
    column: number
};
export type GameConfig = {
    grid: Grid
    tileSize: number,
};

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