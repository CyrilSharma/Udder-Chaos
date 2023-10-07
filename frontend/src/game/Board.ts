import { Container, Graphics, Sprite } from 'pixi.js';
import { Piece } from './Piece';
import { Game } from './Game'
import { app } from '../main'
import {
    Position,
    Grid,
    GameConfig,
    PieceEnum,
    PieceType,
    TileEnum,
    TileType,
    TileMap,
    PieceMap
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

    public buildGame(config: GameConfig) {
        //console.log(PieceMap);
        const grid = config.grid;
        const rows = grid.length;
        const cols = grid[0].length;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let position = { row: r, column: c };
                this.createTile(position, grid[r][c]);
            }
        }

        for (const tiletype of Object.values(PieceEnum)) {
            console.log("Tiletype: " + tiletype);
            console.log("PieceEnum.Player_Red: " + PieceEnum.Player_Red);
            //if (tiletype != PieceEnum.Player_Red) continue;
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
            size: 50,
        });
        const viewPosition = this.getViewPosition(position);
        piece.row = position.row;
        piece.column = position.column;
        piece.x = viewPosition.x + this.tileSize / 2;
        piece.y = viewPosition.y + this.tileSize / 2;
        this.pieces.push(piece);
        this.piecesContainer.addChild(piece);
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