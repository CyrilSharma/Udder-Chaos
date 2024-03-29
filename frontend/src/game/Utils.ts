import { MAPS } from "../maps/Maps"
import { Piece } from "./Piece"
import MersenneTwister from 'mersenne-twister';
import { Point } from 'pixi.js';
import '@pixi/math-extras';

// ---- Game Settings ---- //
export const defaultGameSettings = {
    seed: 0,
    map_id: 0,
    score_goal: 1,
    days_per_round: 4,
    cow_regen_rate: 15,
    cow_sacrifice: 5,
    card_deck_size: 15,
    timer_length: 30,
    difficulty: 500,
}
export type gameSettingsData = typeof defaultGameSettings;

export const defaultGlobalSettings = {
    music_volume: 0.5,
    sound_effect_volume: 0.5,
}
export type globalSettingsData = typeof defaultGlobalSettings;

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
    Red_Destination: 3,
    Yellow_Destination: 4,
    Blue_Destination: 5,
    Purple_Destination: 6,
    Red_Spawn: 7,
    Yellow_Spawn: 8,
    Blue_Spawn: 9,
    Purple_Spawn: 10,
    Red_Enemy_Spawn: 11,
    Yellow_Enemy_Spawn: 12,
    Blue_Enemy_Spawn: 13,
    Purple_Enemy_Spawn: 14,
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
export function canMoveOverAll(attacker: number, pieces: Piece[]) {
    for (let piece of pieces) {
        if (!canMoveOver(attacker, piece.type)) return false;
    }
    return true;
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
export function initSeed(seed: number) {
    gen.init_seed(seed);
}

export function random() {
    return gen.random();
}

//----------Game-----------//
export type Position = {
    row: number;
    column: number;
};

// Information needed for rendering.
export type GameConfig = {
    grid: Grid;
    tileSize: number;
};

export type PieceAction = {action: number; piece: Piece; move: Position};

// We categorize the moves to allow for unique animations.
export type BoardUpdate = PieceAction[][];

// ---- Moves ---- //

export const MoveType = {
    PlayCard: 0,
    RotateCard: 1,
    PurchaseUFO: 2,
}

export type PlayerMove = {
    moveType: number,
    moveData: PlayData | RotateData | Position,
    color: number,
    animated: boolean
}

export type PlayData = {
    index: number
}

export type RotateData = {
    index: number,
    rotation: number
}

//-----Map Functions-----//
export function loadMap(seed: number) {
    const grid: Grid = MAPS[seed];
    return grid;
}

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

