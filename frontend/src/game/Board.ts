import { Container, Graphics, Sprite } from 'pixi.js';
import { Piece } from './Piece';
import { Game } from './Game'
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
    GameUpdate,
    PieceMove
} from './Utils';


export class Board {
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
        this.game = game;

        this.tilesContainer = new Container();
        this.game.addChild(this.tilesContainer);

        this.piecesContainer = new Container();
        this.game.addChild(this.piecesContainer);
    }

    public setup(config: GameConfig) {
        this.rows = config.grid.length;
        this.columns = config.grid[0].length;
        this.tileSize = config.tileSize;
        this.piecesContainer.visible = true;
        this.grid = config.grid;
        this.buildGame(config);
    }

    public updateGame(update: GameUpdate) {
        let normal_changes: { piece: Piece, dest: Position }[] = []
        update.normal_moves.forEach((move) => {
            normal_changes.push({
                piece: this.getPieceByPosition(move.from)!,
                dest: move.to
            });
        });
        let kill_changes: { piece: Piece, dest: Position }[] = []
        update.kill_moves.forEach((move) => {
            normal_changes.push({
                piece: this.getPieceByPosition(move.from)!,
                dest: move.to
            });
        });
        let score_changes: { piece: Piece, dest: Position }[] = []
        update.score_moves.forEach((move) => {
            normal_changes.push({
                piece: this.getPieceByPosition(move.from)!,
                dest: move.to
            })
        });
        normal_changes.forEach((c) => this.normal_move(c.piece, c.dest))
        kill_changes.forEach((c) => this.kill_move(c.piece, c.dest));
        score_changes.forEach((c) => this.score_move(c.piece, c.dest));
    }

    // TODO: Learn how to animate things.
    public normal_move(piece: Piece, dest: Position) {
        this.setPieceLocation(piece, dest);
    }

    public kill_move(piece: Piece, dest: Position) {
        if (isPlayer(piece.type)) return Error("Players cannot kill entities");
        const target = this.getPieceByPosition(dest)!;
        if (!isPlayer(piece.type)) return Error("Enemy cannot be killed");
        this.removePiece(target);
        this.setPieceLocation(piece, dest);
    }

    // TODO: change cow to be not a piece...
    public score_move(piece: Piece, dest: Position) {
        if (!isPlayer(piece.type)) return Error("The AI cannot score");
        // const target = this.getPieceByPosition(dest)!;
        // if (!isPlayer(piece.type)) return Error("Enemy cannot be killed");
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
        const rows = grid.length;
        const cols = grid[0].length;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let position = { row: r, column: c };
                this.createTile(position, grid[r][c]);
                if (grid[r][c] == TileEnum.Pasture) {
                    // this.createPiece(position,)
                    // this.createCow(position);
                }
            }
        }

        for (const tiletype of Object.values(PieceEnum)) {
            console.log(config.starts[tiletype]);
            for (const position of config.starts[tiletype]) {
                this.createPiece(position, tiletype);
            }
        }
    }

    public createTile(position: Position, tileType: TileType) {
        const name = TileMap[tileType];
        const tile = Sprite.from(name);
        const viewPosition = this.getViewPosition(position);
        tile.x = viewPosition.x;
        tile.y = viewPosition.y;
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
        piece.x = viewPosition.x + this.tileSize / 2;
        piece.y = viewPosition.y + this.tileSize / 2;
    }

    public getViewPosition(position: Position) {
        const dy = position.row * this.tileSize;
        const dx = position.column * this.tileSize;
        return { x: dx, y: dy };
    }

    public getPieceByPosition(position: Position) {
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
}