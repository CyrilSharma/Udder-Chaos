import { Container, Graphics } from 'pixi.js';
import { Piece } from './Piece';
import {
    Position,
    Grid,
    GameConfig,
    PieceEnum,
    PieceType,
    TypeMap
} from './Utils';


export class Board {
    /** The grid state, with only numbers */
    public grid: Grid = [];
    /** All piece sprites currently being used in the grid */
    public pieces: Piece[] = [];
    /** Mask all pieces inside board dimensions */
    public piecesMask: Graphics;
    /** A container for the pieces sprites */
    public piecesContainer: Container;
    /** Number of rows in the board */
    public rows = 0;
    /** Number of columns in the board */
    public columns = 0;
    /** The size (width & height) of each board slot */
    public tileSize = 0;

    constructor() {
        this.piecesContainer = new Container();
        this.piecesMask = new Graphics();
        this.piecesMask.beginFill(0xff0000, 0.5);
        this.piecesMask.drawRect(-2, -2, 4, 4);
        this.piecesContainer.mask = this.piecesMask;
    }

    public setup(config: GameConfig) {
        this.rows = config.grid.length;
        this.columns = config.grid[0].length;
        this.tileSize = config.tileSize;
        this.piecesMask.width = this.getWidth();
        this.piecesMask.height = this.getHeight();
        this.piecesContainer.visible = true;
        this.grid = config.grid;
        this.createPiece(
            { row: 10, column: 20 },
            PieceEnum.Player_Red
        );
    }

    public createPiece(position: Position, pieceType: PieceType) {
        const name = TypeMap[pieceType];
        const piece = new Piece();
        const viewPosition = this.getViewPosition(position);
        piece.setup({
            name,
            type: pieceType,
            size: 50,
        });
        piece.row = position.row;
        piece.column = position.column;
        piece.x = viewPosition.x;
        piece.y = viewPosition.y;
        this.pieces.push(piece);
        this.piecesContainer.addChild(piece);
        return piece;
    }

    public getViewPosition(position: Position) {
        const dx = position.row * this.tileSize;
        const dy = position.column * this.tileSize;
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