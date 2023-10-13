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
    PieceMove,
    getTeam,
    TeamEnum,
} from './Utils';

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

    // We pass the game to allow for callbacks...
    constructor(game: Game) {
        super();
        this.game = game;

        this.tilesContainer = new Container();
        this.addChild(this.tilesContainer);

        this.piecesContainer = new Container();
        this.addChild(this.piecesContainer);
    }

    public setup(config: GameConfig) {
        this.rows = config.grid.length;
        this.columns = config.grid[0].length;
        this.tileSize = config.tileSize;
        this.piecesContainer.visible = true;
        this.grid = config.grid;
        this.buildGame(config);
    }

    public updateGame(update: BoardUpdate) {
        let normal_changes: { piece: Piece; dest: Position }[] = [];
        update.normal_moves.forEach((move) => {
            normal_changes.push({
                piece: this.getPieceByPosition(move.from)!,
                dest: move.to,
            });
        });
        let kill_changes: { piece: Piece; dest: Position }[] = [];
        update.kill_moves.forEach((move) => {
            kill_changes.push({
                piece: this.getPieceByPosition(move.from)!,
                dest: move.to,
            });
        });
        let score_changes: { piece: Piece; dest: Position }[] = [];
        update.score_moves.forEach((move) => {
            score_changes.push({
                piece: this.getPieceByPosition(move.from)!,
                dest: move.to,
            });
        });
        normal_changes.forEach((c) => this.normal_move(c.piece, c.dest));
        kill_changes.forEach((c) => this.kill_move(c.piece, c.dest));
        score_changes.forEach((c) => this.score_move(c.piece, c.dest));
        // TODO add to game updatelist
    }

    // TODO: Learn how to animate things.
    public normal_move(piece: Piece, dest: Position) {
        this.setPieceLocation(piece, dest);
    }

    public kill_move(piece: Piece, dest: Position) {
        console.log("KILLING MOVE");
        console.log(piece);
        console.log(dest);
        if (isPlayer(piece.type)) return; //return Error('Players cannot kill entities');
        const target = this.getPieceByPosition(dest)!;
        if (!isPlayer(target.type)) return; //return Error('Enemy cannot be killed');
        this.removePiece(target);
        this.setPieceLocation(piece, dest);
    }

    // TODO: change cow to be not a piece...
    public score_move(piece: Piece, dest: Position) {
        if (!isPlayer(piece.type)) return; // return Error('The AI cannot score');
        
        // TODO: actually do something when scoring
        const target = this.getPieceByPosition(dest)!;
        if (getTeam(target.type) != TeamEnum.Cow) return; // return Error("Cannot score on this piece");
        this.removePiece(target);
        console.log("Yay you score!");
        piece.addScore();
        
        this.setPieceLocation(piece, dest);
    }

    public removePiece(piece: Piece) {
        if (this.pieces.includes(piece)) {
            this.pieces.splice(this.pieces.indexOf(piece), 1);
        }
        if (piece.parent) {
            piece.parent.removeChild(piece);
        }
    }

    public buildGame(config: GameConfig) {
        //console.log(PieceMap);
        const grid = config.grid;
        
        // TEMP initialization of each piece for visualization debug
        for (const piecetype of Object.values(PieceEnum)) {
            // console.log(config.starts[piecetype]);
            for (const position of config.starts[piecetype]) {
                // Random generate tiles that are occupied by a piece to not be impassible or destinations
                if (grid[position.row][position.column] == TileEnum.Impassible || grid[position.row][position.column] == TileEnum.Destination) {
                    // console.log("Piece spawning on top of a tile...");
                    let rand = Math.floor(Math.random() * 2);
                    if (rand == 0) grid[position.row][position.column] = TileEnum.Plain;
                    else grid[position.row][position.column] = TileEnum.Pasture;
                    // console.log(`Fixed ${[position.row, position.column]} to ${grid[position.row][position.column]}`);
                }
                this.createPiece(position, piecetype);
            }
        }
        
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
        
    }

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

    public setPieceLocation(piece: Piece, position: Position) {
        const viewPosition = this.getViewPosition(position);
        piece.row = position.row;
        piece.column = position.column;
        // Actually display pieces at the right location
        piece.x = viewPosition.x - 8 * this.tileSize / 4;
        piece.y = viewPosition.y - 8 * this.tileSize / 4;
    }

    public getViewPosition(position: Position) {
        const dy = position.row * this.tileSize;
        const dx = position.column * this.tileSize;
        return { x: dx, y: dy };
    }

    public getPieceByPosition(position: Position) {
        // console.log(`Getting piece at ${[position.row, position.column]}`);
        for (const piece of this.pieces) {
            if (piece.row === position.row && piece.column === position.column) {
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
