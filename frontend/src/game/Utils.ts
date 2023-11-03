import { MAPS } from "../maps/Maps"
import { Piece } from "./Piece"
import MersenneTwister from 'mersenne-twister';
import { Point } from 'pixi.js';
import '@pixi/math-extras';

// Constants
export const COW_REGEN_RATE = 12; // Respawn after 3 days
export const COW_SACRIFICE = 3; 

export const SCORE_GOAL = 10;
export const DAYS_PER_ROUND = 3;

//-----Menu-----//
export type PlayerInfo = {
    id: string,
    name: string,
    color: number
}

//-----Tiles-----//
export const TileEnum = {
    Plain: 0,
    Pasture: 1,
    Impassible: 2,
    Destination: 3,
    Red_Enemy_Spawn: 4,
    Yellow_Enemy_Spawn: 5,
    Blue_Enemy_Spawn: 6,
    Purple_Enemy_Spawn: 7,
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
export const TeamEnum = {
    Player: 0,
    Enemy: 1,
    Cow: 2
}
export type PieceType = number;
export const PieceMap: Record<number, string> = {};
Object.keys(PieceEnum).forEach((key) => {
    const idx = PieceEnum[key as keyof typeof PieceEnum];
    PieceMap[idx] = `images/${key.toLowerCase()}.png`;
});
export function isPlayer(piece_type: number) {
    return getTeam(piece_type) == TeamEnum.Player;
}
export function getTeam(piece_type: number) {
    for (const key of Object.keys(PieceEnum)) {
        const val = PieceEnum[key as keyof typeof PieceEnum];
        if (val != piece_type) continue;
        if (key.toLowerCase().includes('player')) return TeamEnum.Player;
        else if (key.toLowerCase().includes('enemy')) return TeamEnum.Enemy;
        else if (key.toLowerCase().includes('cow')) return TeamEnum.Cow;
        return Error('Invalid Piece Type: ' + piece_type);
    }
    return Error('Invalid Piece Type');
}
export function canMoveOver(attacker: number, defender: number) {
    // If on differing teams, i.e, moving into cow space, jet kills ufo, ufo kills jet.
    return (getTeam(defender) != getTeam(attacker))
}
export function checkActionType(attacker: number, defender: number) {
    if (getTeam(defender) == TeamEnum.Cow && getTeam(attacker) == TeamEnum.Player) {
        return ActionType.Abduct_Action; 
    }
    else if (
        (getTeam(defender) == TeamEnum.Enemy && getTeam(attacker) == TeamEnum.Player) ||
        (getTeam(defender) == TeamEnum.Player && getTeam(attacker) == TeamEnum.Enemy)
    ) {
        return ActionType.Kill_Action;
    }
    else {
        return -1;
    }
}
export const Player = PieceEnum;
// Move direction values for now
export const dx = [1, 0, -1, 0];
export const dy = [0, -1, 0, 1];
// Action types
export const ActionType = {
    Normal_Move: 0,
    Obstruction_Move: 1,
    Kill_Action: 2,
    Abduct_Action: 3,
    Score_Action: 4
}

export const TurnType = {
    1: "Red",
    2: "Yellow",
    3: "AI",
    4: "Blue",
    5: "Purple",
    6: "AI"
}
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
/** Durstenfeld shuffle for generating a card queue
 *  Source: https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
 */
export function shuffle(array: any[]) {
    for (var i = array.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
  
    return array;
}

let gen = new MersenneTwister();
export function initSeed(seed: string) {
    let numSeed = 0;
    for (let i = 0; i < seed.length; i++) {
        numSeed += seed.charCodeAt(i);
    }
    gen.init_seed(numSeed);
}

export function random() {
    return gen.random();
}

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
export type PieceAction = {action: number; piece: Piece; move: Position};
// We categorize the moves to allow for unique animations.
export type BoardUpdate = PieceAction[][];

//     normal_moves: PieceMove[]; // Moves which kill nothing.
//     kill_moves: PieceMove[]; // Moves which kill a unit.
//     abduct_moves: PieceMove[]; // Moves which abduct a cow.
//     score_moves: PieceMove[]; // Moves which score cows.
// };

//-----Map Functions-----//
export function loadMap(seed: number) {
    const grid: Grid = parseCSVGrid(MAPS[seed]);
    return grid;
}

export function createRandomGrid(rows = 16, cols = 16) {
    const grid: Grid = [];
    const tiles = [TileEnum.Plain, TileEnum.Pasture, TileEnum.Impassible, TileEnum.Destination];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            let idx = Math.floor(random() * tiles.length);
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
            const tile: TileType = parseInt(value);
            // const tile: TileType = 0; // SET NO OBSTACLES FOR DEBUGGING
            tiles.push(tile);
        }
        if (tiles.length > 0) {
            grid.push(tiles);
        }
    }
    return grid;
};

// --- Math --- //

export function angleBetween(vectorOne: Point, vectorTwo: Point) {
    let angle = Math.atan2( vectorOne.x*vectorTwo.y - vectorOne.y*vectorTwo.x, vectorOne.x*vectorTwo.x + vectorOne.y*vectorTwo.y);
    if (angle < 0) {
        angle += 2 * Math.PI;
    }
    return angle;
}

export function mod(n: number, m: number) {
    return ((n % m) + m) % m;
}

