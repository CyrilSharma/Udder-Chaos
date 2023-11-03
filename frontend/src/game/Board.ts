import { Container, Sprite, Graphics } from 'pixi.js';
import { Button, FancyButton } from '@pixi/ui';
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
    random,
    COW_REGEN_RATE,
} from './Utils';
import { EndGameScreen } from '../ui_components/EndGameScreen';
import server from "../server";

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
    /** The overlay to be displayed upon winning the game */
    public winScreen: EndGameScreen;
    /** THe overlay to be displayed upon losing the game */
    public loseScreen: EndGameScreen;
    /** How many pieces each player countrols */
    public playerPieces: number[] = [];
    /** Pasture tiles to respawn, outer array represents turns, middle array represent tiles, inner array represents tile coords */
    public pastureRegen: Position[][] = [];
    /** Enemy tiles to spawn enemies each round */
    public enemyRegen: Position[][] = [];
    /** Array holding respawn counter objects */
    public respawnCounter: FancyButton[] = [];

    // We pass the game to allow for callbacks...
    constructor(game: Game) {
        super();
        this.game = game;

        this.tilesContainer = new Container();
        this.addChild(this.tilesContainer);
        this.piecesContainer = new Container();
        this.addChild(this.piecesContainer);
        this.winScreen = new EndGameScreen(true)
        this.loseScreen = new EndGameScreen(false);
        this.addChild(this.winScreen);
        this.addChild(this.loseScreen);

        for (let i = 0; i < COW_REGEN_RATE; i++) {
            this.pastureRegen.push([])
        }
        for (let i = 0; i < 4; i++) {
            this.enemyRegen.push([])
        }

        for (let tile = 0; tile < 256; tile++) {
            this.respawnCounter[tile] = new FancyButton({
                defaultView: (new Button(
                    new Graphics()
                            .beginFill(0xffffff)
                            .drawCircle(20, 20, 20)
                )).view,
                anchor: 0.5,
                text: ""
            });
            this.respawnCounter[tile].alpha = 0;
            this.respawnCounter[tile].on('mouseover', () => {
                this.respawnCounter[tile].alpha = 1;
            });
            this.respawnCounter[tile].on('mouseout', () => {
                this.respawnCounter[tile].alpha = 0;
            });            
            this.addChild(this.respawnCounter[tile]);
        }
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
        this.winScreen.visible = false;
        this.loseScreen.visible = false;
    }

    // Anything that should happen when the game ends will go here eventually
    public endGame(success: boolean, message: string) {
        if (success) {
            this.winScreen.visible = true;
        } else {
            this.loseScreen.visible = true;
        }
    }

    // Takes a board update, and performs corresponding updates and rerenders at the end.
    public async updateGame(update: BoardUpdate) {
        // Loop through steps in update
        this.game.animating = true;
        for (let i = 0; i < update.length; i++) {
            for (let j = 0; j < update[i].length; j++) {
                switch (update[i][j].action) {
                    case ActionType.Normal_Move: { this.normal_move(update[i][j]); break; }
                    case ActionType.Obstruction_Move: { this.obstructed_move(update[i][j]); break; }
                    case ActionType.Kill_Action: { this.kill_action(update[i][j]); break; }
                    case ActionType.Abduct_Action: { this.abduct_action(update[i][j]); break; }
                    case ActionType.Score_Action: { this.score_action(update[i][j]); break; }
                    default: { throw Error("Illegal move in updateGame"); break; }
                }
            }
            if (update[i].length > 0) {
                // Sleep for animation time
                await new Promise(r => setTimeout(r, 500))
            }
        }
        this.game.animating = false;
    }

    // TODO: Learn how to animate things.
    public normal_move(action: PieceAction) {
        let piece = action.piece;
        let dest = action.move;
        this.setPieceLocation(piece, dest);
    }

    public obstructed_move(action: PieceAction) {
        // Do an animation toward the destination but fail.
        let piece = action.piece;
        let dest = action.move;
        
        let xShift = dest.column - piece.column;
        let yShift = dest.row - piece.row;

        const viewPosition = this.getViewPosition(dest);
        // Actually display pieces at the right location
        action.piece.animateBounce(piece.x + xShift * this.tileSize / 4, piece.y + yShift * this.tileSize / 4);
    }

    // Enemy killing a player piece
    public async kill_action(action: PieceAction) {
        let piece = action.piece;
        let dest = action.move;

        const target = this.getPieceByPosition(dest)!;
        await target.animateDestroy();
        this.removePiece(target);

        // Remove a piece from this player
        if (getTeam(target.type) == TeamEnum.Player) {
            this.playerPieces[target.type] -= 1;

            // If this player has no more pieces end the game
            if (this.playerPieces[target.type] == 0) {
                this.game.endGame(false, "All of your UFOs were wiped out.");
            }
        }
    }

    // Player killing a cow piece
    // TODO: change cow to be not a piece...
    public async abduct_action(action: PieceAction) {
        let piece = action.piece;
        let dest = action.move;

        const target = this.getPieceByPosition(dest, TeamEnum.Cow)!;
        await target.animateAbducted(this.tileSize);
        this.removePiece(target);
        piece.addScore();

        // Add respawn to pasture
        this.pastureRegen[this.game.turnCount % COW_REGEN_RATE].push(dest);
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
                this.createPiece(position, piecetype);

                if (getTeam(piecetype) == TeamEnum.Player) {
                    this.playerPieces[piecetype] += 1;
                }
            }
        }
        
        // Create all tiles, and generate cows on pastures
        const rows = grid.length;
        const cols = grid[0].length;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let position = { row: r, column: c };
                this.createTile(position, grid[r][c]);
                if (grid[r][c] == TileEnum.Pasture) {
                    if (this.getPieceByPosition(position) != null) continue;
                    this.createPiece(position, PieceEnum.Cow);
                } else if (grid[r][c] >= TileEnum.Red_Enemy_Spawn) {
                    // If it's an enemy spawner, spawn the corresponding enemy type
                    this.createPiece(position, grid[r][c] + 1);
                    this.enemyRegen[grid[r][c] - TileEnum.Red_Enemy_Spawn].push(position);
                }
            }
        }
        //console.log(`player pieces: ${this.playerPieces}`)
    }

    // Creating and rendering individual tile
    public createTile(position: Position, tileType: TileType) {
        const name = TileMap[tileType];
        const tile: Sprite = Sprite.from(name);
        const viewPosition = this.getViewPosition(position);
        tile.x = viewPosition.x;
        tile.y = viewPosition.y;
        tile.width = this.tileSize;
        tile.height = this.tileSize;

        tile.eventMode = 'static';
        tile.on('pointerup', () => {
            if (this.game.buyButton.dragging && this.game.ourTurn()) {
                server.purchaseUFO(position, this.game.playerColor);
                this.purchaseUFO(position, this.game.playerColor);
            }
        });

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

        if (PieceEnum.Player_Red <= pieceType && pieceType <= PieceEnum.Player_Purple) {
            this.playerPieces[pieceType] += 1;
        }
    }

    /**  Moves piece */
    public setPieceLocation(piece: Piece, position: Position) {
        const viewPosition = this.getViewPosition(position);
        piece.row = position.row;
        piece.column = position.column;
        // Actually display pieces at the right location
        piece.animateMove(viewPosition.x - 8 * this.tileSize / 4, viewPosition.y - 8 * this.tileSize / 4)
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

    public spawnCows(turnCount: number) {
        // Loop through pasture tiles that need new cows
        this.pastureRegen[turnCount % COW_REGEN_RATE].forEach((tilePosition) => {
            this.createPiece(tilePosition, PieceEnum.Cow);
            let tile = tilePosition.row * 16 + tilePosition.column;
            this.respawnCounter[tile].text = "";
        });
        this.pastureRegen[turnCount % COW_REGEN_RATE] = [];

        // Update spawn numbers
        for (let i = 0; i < COW_REGEN_RATE; i++) {
            //console.log(`(turnCount + i) % COW_REGEN_RATE = ${(turnCount + i) % COW_REGEN_RATE}`);
            this.pastureRegen[(turnCount + i) % COW_REGEN_RATE].forEach((tilePosition) => {
                //console.log(`Tile Position is : ${tilePosition.row}, ${tilePosition.column}`);
                //console.log(`^^^ respawns in ${(COW_REGEN_RATE - turnCount) % COW_REGEN_RATE} days`);
                let days = ((turnCount + i) % COW_REGEN_RATE) - turnCount % 12;
                //let days = (COW_REGEN_RATE - i) % COW_REGEN_RATE
                if (days < 0) {
                    days += 12;
                }
                let view = this.getViewPosition(tilePosition);
                let tile = tilePosition.row * 16 + tilePosition.column;
                //console.log(`Tile num: ${tile}`);
                this.respawnCounter[tile].text = days;
                this.respawnCounter[tile].x = view.x + this.tileSize * 0.5;
                this.respawnCounter[tile].y = view.y + this.tileSize * 0.5;         
            });
        }
    }

    public spawnEnemies() {
        for (let i = 0; i < 4; i++) {
            this.enemyRegen[i].forEach((tilePosition) => {
                this.createPiece(tilePosition, PieceEnum.Enemy_Red + i);
            });
        }
    }

    public resize(bounds: Array<number>, left: number, right: number, bottom: number) {
        // Top, bottom, left, right
        // this.width = (bounds[3] - bounds[2]);
        // this.height = (bounds[1] - bounds[0]);

        if (bottom < right - left) {
            this.height = bottom;
            this.width = bottom;
        } else {
            this.width = right - left;
            this.height = right - left;
        }

        this.x = this.width * -0.5;
        this.y = this.height * -0.5;
    }

    public purchaseUFO(position: Position, color: number) {
        if (this.game.totalScore > 0 && 
            this.getTileAtPosition(position) == TileEnum.Destination && 
            this.getPieceByPosition(position) == null) {
                this.game.scorePoints(-1);
                this.createPiece(position, color);
        } else {
            console.log("You can't purchase a UFO!")
        }

    }
}
