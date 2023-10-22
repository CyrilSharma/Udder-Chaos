import { Container, Sprite } from 'pixi.js';
import { Piece } from './Piece';
import { Game } from './Game';
import {
    Position,
    Grid,
    GameConfig,
    PieceEnum,
    PieceType,
    TileType,
    TileEnum,
    TileMap,
    PieceMap,
    isPlayer,
    BoardUpdate,
    PieceAction,
    getTeam,
    TeamEnum,
    ActionType,
} from './Utils';
/**
 * Board class
 * Handles creation of board, placing obstacles, and stores all tiles and pieces
 * Accepts piece updates and rerenders after each update
 * Supports querying for information on the game, including getting pieces and tiles currently on the board
 */
export class Board extends Container {
    public game: Game;
    /** The grid state, with only numbers */
    public grid: Grid = [];
    /** All piece sprites currently being used in the grid */
    public pieces: Piece[] = [];
    /** A container for the pieces sprites */
    public piecesContainer: Container;
    /** A container for all the tile sprites */
    public tilesContainer: Container;
    /** Number of rows in the board */
    public rows = 0;
    /** Number of columns in the board */
    public columns = 0;
    /** The size (width & height) of each board slot */
    public tileSize = 0;
    /** How many pieces each player countrols */
    public playerPieces: number[] = [];

    // We pass the game to allow for callbacks...
    constructor(game: Game) {
        super();
        this.game = game;

        this.tilesContainer = new Container();
        this.addChild(this.tilesContainer);

        this.piecesContainer = new Container();
        this.addChild(this.piecesContainer);
    }

    // Creates the initial board with some config
    // Called during Game setup
    public setup(config: GameConfig) {
        this.rows = config.grid.length;
        this.columns = config.grid[0].length;
        this.tileSize = config.tileSize;
        this.piecesContainer.visible = true;
        this.grid = config.grid;
        this.buildGame(config);
    }

    // Anything that should happen when the game ends will go here eventually
    public endGame() {

    }

    // Takes a board update, and performs corresponding updates and rerenders at the end.
    public updateGame(update: BoardUpdate) {
        // Loop through steps in update
        for (let i = 0; i < update.length; i++) {
            for (let j = 0; j < update[i].length; j++) {
                // let piece = update[i][j].piece!;
                // let dest = update[i][j].to;
                switch (update[i][j].action) {
                    case ActionType.Normal_Move: { this.normal_move(update[i][j]); break; }
                    case ActionType.Obstruction_Move: { this.obstructed_move(update[i][j]); break; }
                    case ActionType.Kill_Action: { this.kill_action(update[i][j]); break; }
                    case ActionType.Abduct_Action: { this.abduct_action(update[i][j]); break; }
                    case ActionType.Score_Action: { this.score_action(update[i][j]); break; }
                    default: { throw Error("Illegal move in updateGame"); break; }
                }
            }
        }
    }

    // TODO: Learn how to animate things.
    public normal_move(action: PieceAction) {
        let piece = action.piece;
        let dest = action.moves[0];
        this.setPieceLocation(piece, dest);
    }

    public obstructed_move(action: PieceAction) {
        // Do an animation toward the destination but fail.
    }

    // Enemy killing a player piece
    public kill_action(action: PieceAction) {
        let piece = action.piece;
        let dest = action.moves[0];

        console.log("KILLING MOVE");
        console.log(piece);
        console.log(dest);
        if (isPlayer(piece.type)) return; //return Error('Players cannot kill entities');
        const target = this.getPieceByPosition(dest)!;
        if (!isPlayer(target.type)) return; //return Error('Enemy cannot be killed');
        this.removePiece(target);

        // Remove a piece from this player
        this.playerPieces[target.type] -= 1;

        // If this player has no more pieces end the game
        if (this.playerPieces[target.type] == 0) {
            this.game.endGame();
        }
    }

    // Player killing a cow piece
    // TODO: change cow to be not a piece...
    public abduct_action(action: PieceAction) {
        let piece = action.piece;
        let dest = action.moves[0];

        // TODO: actually do something when abduct
        const target = this.getPieceByPosition(dest, TeamEnum.Cow)!;
        this.removePiece(target);
        console.log("Yay you score!");
        piece.addScore();
    }

    // Player scoring cows on destination
    public score_action(action: PieceAction) {
        let piece = action.piece;
        let points: number = piece.removeScore();
        this.game.scorePoints(points);
    }

    // Removes a piece from the board
    public removePiece(piece: Piece) {
        if (this.pieces.includes(piece)) {
            this.pieces.splice(this.pieces.indexOf(piece), 1);
        }
        if (piece.parent) {
            piece.parent.removeChild(piece);
        }
    }

    // Creation of the actual board, including all tiles and placing all pieces
    public buildGame(config: GameConfig) {
        //console.log(PieceMap);
        const grid = config.grid;
        
        // TEMP initialization of each piece for visualization debug
        for (const piecetype of Object.values(PieceEnum)) {
            if (getTeam(piecetype) == TeamEnum.Player) {
                this.playerPieces[piecetype] = 0;
            }
            // console.log(config.starts[piecetype]);
            for (const position of config.starts[piecetype]) {
                // Random generate tiles that are occupied by a piece to not be impassible or destinations
                if (grid[position.row][position.column] == TileEnum.Impassible) {
                    // console.log("Piece spawning on top of a tile...");
                    let rand = Math.floor(Math.random() * 2);
                    if (rand == 0) grid[position.row][position.column] = TileEnum.Plain;
                    else grid[position.row][position.column] = TileEnum.Pasture;
                    // console.log(`Fixed ${[position.row, position.column]} to ${grid[position.row][position.column]}`);
                }
                this.createPiece(position, piecetype);

                if (getTeam(piecetype) == TeamEnum.Player) {
                    this.playerPieces[piecetype] += 1;
                }
            }
        }
        
        // Create all tiles, and randomly generate cows on pastures
        const rows = grid.length;
        const cols = grid[0].length;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let position = { row: r, column: c };
                this.createTile(position, grid[r][c]);
                if (grid[r][c] == TileEnum.Pasture) {
                    if (this.getPieceByPosition(position) != null) continue;
                    if (Math.random() * 4 < 3) continue;
                    this.createPiece(position, PieceEnum.Cow);
                    // this.createPiece(position,)
                    // this.createCow(position);
                }
            }
        }
        console.log(`player pieces: ${this.playerPieces}`)
    }

    // Creating and rendering individual tile
    public createTile(position: Position, tileType: TileType) {
        const name = TileMap[tileType];
        const tile = Sprite.from(name);
        const viewPosition = this.getViewPosition(position);
        tile.x = viewPosition.x;
        tile.y = viewPosition.y;
        tile.width = this.tileSize;
        tile.height = this.tileSize;
        this.tilesContainer.addChild(tile);
    }

    /** Creating and rendering individual piece */
    public createPiece(position: Position, pieceType: PieceType) {
        const name = PieceMap[pieceType];
        const piece = new Piece();
        piece.setup({
            name,
            type: pieceType,
            size: this.tileSize,
        });
        this.setPieceLocation(piece, position);
        this.pieces.push(piece);
        this.piecesContainer.addChild(piece);
    }

    /**  Moves piece */
    public setPieceLocation(piece: Piece, position: Position) {
        const viewPosition = this.getViewPosition(position);
        piece.row = position.row;
        piece.column = position.column;
        // Actually display pieces at the right location
        piece.x = viewPosition.x - 8 * this.tileSize / 4;
        piece.y = viewPosition.y - 8 * this.tileSize / 4;
    }

    /**  Return visual piece location on the board */
    public getViewPosition(position: Position) {
        const dy = position.row * this.tileSize;
        const dx = position.column * this.tileSize;
        return { x: dx, y: dy };
    }

    /** 
     * Return piece at a certain position, or null if there isn't one
     * Optional argument for team type.
     */
    public getPieceByPosition(position: Position, team: number = -1) {
        // console.log(`Getting piece at ${[position.row, position.column]}`);
        for (const piece of this.pieces) {
            if (piece.row === position.row && piece.column === position.column && (team == -1 || team == getTeam(piece.type))) {
                return piece;
            }
        }
        return null;
    }

    /** Get the visual width of the board */
    public getWidth() {
        return this.tileSize * this.columns;
    }

    /** Get the visual height of the board */
    public getHeight() {
        return this.tileSize * this.rows;
    }
    
    /** Get the tile at a position on the board */
    public getTileAtPosition(position: Position) {
        // handle out of bounds
        // console.log("query at: ", position);
        if (position.row < 0 || position.row >= this.rows || position.column < 0 || position.column >= this.columns) return TileEnum.Impassible;
        // console.log(this.grid[position.row][position.column]);
        return this.grid[position.row][position.column];
    }
}
