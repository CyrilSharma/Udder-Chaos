import { MAPS } from "../maps/Maps"

//-----Tiles-----//
export const TileEnum = {
    Plain: 0,
    Pasture: 1,
    Impassible: 2,
    Destination: 3,
};
// Weighting of tiles when generating a random board
export const TileWeights = {
    0: 75,
    1: 10,
    2: 10,
    3: 5
};
export type TileType = number;
export const TileMap: Record<number, string> = {};
Object.keys(TileEnum).forEach((key) => {
    const idx = TileEnum[key as keyof typeof TileEnum];
    TileMap[idx] = `images/${key.toLowerCase()}.png`;
});
export type Grid = TileType[][];

//-----Pieces-----//
export const PieceEnum = {
    Cow: 0,
    Player_Red: 1,
    Player_Yellow: 2,
    Player_Blue: 3,
    Player_Purple: 4,
    Enemy_Red: 5,
    Enemy_Yellow: 6,
    Enemy_Blue: 7,
    Enemy_Purple: 8
};
export type PieceType = number;
export const PieceMap: Record<number, string> = {};
Object.keys(PieceEnum).forEach((key) => {
    const idx = PieceEnum[key as keyof typeof PieceEnum];
    PieceMap[idx] = `images/${key.toLowerCase()}.png`;
});
export function isPlayer(piece_type: number) {
    for (const key of Object.keys(PieceEnum)) {
        const val = PieceEnum[key as keyof typeof PieceEnum];
        if (val != piece_type) continue;
        return key.toLowerCase().includes('player');
    }
    throw Error('Invalid Piece Type');
}
export const Player = {
    Player_Red: 1,
    Player_Yellow: 2,
    Player_Blue: 3,
    Player_Purple: 4,
    Enemy_Red: 5,
    Enemy_Yellow: 6,
    Enemy_Blue: 7,
    Enemy_Purple: 8
};

//---------Cards------------//
export const DirectionEnum = {
    RIGHT: 0,
    UP: 1,
    LEFT: 2,
    DOWN: 3
};
export type Direction = number;
export const ColorEnum = {
    RED: 0,
    GREEN: 1,
    BLUE: 2,
    ORANGE: 3
};
export type Color = number;

//----------Game-----------//
export type Position = {
    row: number;
    column: number;
};
export type GameConfig = {
    grid: Grid;
    starts: Position[][];
    tileSize: number;
};
export type PieceUpdate = {};
export type PieceMove = { from: Position; to: Position };
// We categorize the moves to allow for unique animations.
export type BoardUpdate = {
    normal_moves: PieceMove[]; // Moves which kill nothing.
    kill_moves: PieceMove[]; // Moves which kill a unit.
    score_moves: PieceMove[]; // Moves which abduct a cow.
};

//-----Functions-----//
export function loadMap(seed: number) {
    const grid: Grid = parseCSVGrid(MAPS[seed]);
    console.log(grid);
    return grid;
}

export function createRandomGrid(rows = 16, cols = 16) {
    const grid: Grid = [];
    const tiles = [TileEnum.Plain, TileEnum.Pasture, TileEnum.Impassible, TileEnum.Destination];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let idx = Math.floor(Math.random() * tiles.length);
            if (!grid[r]) grid[r] = [];
            grid[r][c] = tiles[idx];
        }
    }
    return grid;
};

// Create a CSV string from an input Grid
function createCSV(grid: Grid) {
    let csv_string = ""
    for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[0].length; c++) {
            csv_string += grid[r][c]
            if (c < grid[0].length - 1) {
                csv_string += ","
            }
        }
        if (r < grid.length - 1) {
            csv_string += "\n"
        }
    }
    return csv_string;
};

// Create a grid from a CSV string
function parseCSVGrid(csvString: string) {
    const grid: Grid = [];
    const rows = csvString.split("\n");

    for (const row of rows) {
        const values = row.split(",");
        const tiles: TileType[] = [];
        for (const value of values) {
            // const tile: TileType = parseInt(value);
            const tile: TileType = 0; // SET NO OBSTACLES FOR DEBUGGING
            tiles.push(tile);
        }
        if (tiles.length > 0) {
            grid.push(tiles);
        }
    }
    return grid;
};