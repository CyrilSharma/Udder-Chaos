import { Container } from "pixi.js";
import { Piece } from "./Piece";
import { GameConfig, Grid } from "./Utils";

// Currently unused class for handling movement and other game logic
export class LogicHandler {
    /** The grid state, with only numbers */
    public grid: Grid = [];
    /** All piece sprites currently being used in the grid */
    public pieces: Piece[] = [];
    /** A container for the pieces sprites */
    public piecesContainer!: Container;
    /** A container for all the tile sprites */
    public tilesContainer!: Container;
    /** Number of rows in the board */
    public rows = 0;
    /** Number of columns in the board */
    public columns = 0;

    public setup(config: GameConfig) {
        this.rows = config.grid.length;
        this.columns = config.grid[0].length;
        this.grid = config.grid;
    }


}