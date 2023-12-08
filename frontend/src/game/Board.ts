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
    MoveType
} from './Utils';
import { EndGameScreen } from '../ui_components/EndGameScreen';
import server from "../server";
import { SoundHandler } from './SoundHandler';

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

        for (let i = 0; i < this.game.gameSettings.getValue("cow_regen_rate"); i++) {
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
            this.respawnCounter[tile].on('mouseenter', () => {
                console.log(`respawn counter mouseover: ${tile}`);
                if (tile == 255) return; // I'm not sure why but the last one is always in the top left corner??
                // Block showing respawn counter if any players or cows are on this tile
                if (this.getPiecesByPosition({row: Math.floor(tile/16), column: tile % 16}, TeamEnum.Player).length == 0 &&
                this.getPiecesByPosition({row: Math.floor(tile/16), column: tile % 16}, TeamEnum.Cow).length == 0) {
                    this.respawnCounter[tile].alpha = 1;
                } else {
                    this.respawnCounter[tile].visible = false; // Hide this respawn counter until the pieces on this tile move off
                }
            });
            this.respawnCounter[tile].on('mouseleave', () => {
                this.respawnCounter[tile].alpha = 0;
            });
            // this.respawnCounter[tile].zIndex = -1;            
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
    public async updateGame(update: BoardUpdate, animated: boolean) {
        // Loop through steps in update
        for (let i = 0; i < update.length; i++) {
            for (let j = 0; j < update[i].length; j++) {
                switch (update[i][j].action) {
                    case ActionType.Normal_Move: { this.normal_move(update[i][j], animated); break; }
                    case ActionType.Obstruction_Move: { this.obstructed_move(update[i][j], animated); break; }
                    case ActionType.Kill_Action: { this.kill_action(update[i][j], animated); break; }
                    case ActionType.Abduct_Action: { this.abduct_action(update[i][j], animated); break; }
                    case ActionType.Score_Action: { this.score_action(update[i][j], animated); break; }
                    default: { throw Error("Illegal move in updateGame"); break; }
                }
            }
            if (update[i].length > 0 && animated) {
                // Sleep for animation time
                await new Promise(r => setTimeout(r, 500))
            }
        }
    }

    public normal_move(action: PieceAction, animated: boolean) {
        
        let piece = action.piece;
        let dest = action.move;
        if (getTeam(piece.type) == TeamEnum.Player) {
            SoundHandler.playSFX("ufo-move.ogg");
        } else {
            SoundHandler.playSFX("plane-move.ogg");
        }
        this.setPieceLocation(piece, dest, animated);
    }

    public obstructed_move(action: PieceAction, animated: boolean) {
        
        // Do an animation toward the destination but fail.
        let piece = action.piece;
        let dest = action.move;
        
        if (getTeam(piece.type) == TeamEnum.Player) {
            SoundHandler.playSFX("ufo-move.ogg");
        } else {
            SoundHandler.playSFX("plane-move.ogg");
        }

        let xShift = dest.column - piece.column;
        let yShift = dest.row - piece.row;

        const viewPosition = this.getViewPosition(dest);
        // Actually display pieces at the right location
        action.piece.animateBounce(piece.x + xShift * this.tileSize / 4, piece.y + yShift * this.tileSize / 4, animated);
    }

    // Enemy killing a player piece
    public async kill_action(action: PieceAction, animated: boolean) {
        let piece = action.piece;
        let dest = action.move;
        
        // Get kill target from list of pieces at position
        const targets = this.getPiecesByPosition(dest);
        if (targets.length == 0) throw new Error("No pieces at kill move destination");
        let target = targets[0];

        // Search for first player or enemy piece
        let index = 0;
        while (getTeam(target.type) != TeamEnum.Player && getTeam(target.type) != TeamEnum.Enemy) {
            if (index + 1 == targets.length) throw new Error("No killable pieces at kill move destination");
            target = targets[++index];
        }
        await target.animateDestroy(animated);
        this.removePiece(target);
        
        // Remove a piece from this player
        if (getTeam(target.type) == TeamEnum.Player) {
            SoundHandler.playSFX("ufo-destroyed.mp3");
            this.playerPieces[target.type] -= 1;
            this.game.players[(target.type - 1)].setUnits(
                this.playerPieces[target.type]
            );
            if (this.playerPieces[target.type] == 0) {
                this.game.endGame(false, "All of your UFOs were wiped out.");
            }
        } else {
            this.game.AI.setUnits(this.game.AI.getUnits() - 1);
            SoundHandler.playSFX("ufo-laser.ogg");
        }
    }

    // Player killing a cow piece
    // TODO: change cow to be not a piece...
    public async abduct_action(action: PieceAction, animated: boolean) {
        SoundHandler.playSFX("ufo-abduction.ogg");
        SoundHandler.playSFX("cow-moo.mp3");
        let piece = action.piece;
        let dest = action.move;

        const targets = this.getPiecesByPosition(dest, TeamEnum.Cow);
        if (targets.length == 0) throw new Error("No cows at abduct action destination");
        let target = targets[0];
        await target.animateAbducted(this.tileSize, animated);
        this.removePiece(target);
        piece.addScore();

        // Add respawn to pasture
        this.pastureRegen[this.game.turnCount % this.game.gameSettings.getValue("cow_regen_rate")].push(dest);
    }

    // Player scoring cows on destination
    public score_action(action: PieceAction, animated: boolean) {
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
        }
        
        // Create all tiles, and generate cows on pastures
        const rows = grid.length;
        const cols = grid[0].length;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                let position = { row: r, column: c };
                this.createTile(position, grid[r][c]);
                if (grid[r][c] == TileEnum.Pasture) {
                    if (this.getPiecesByPosition(position).length != 0) continue;
                    this.createPiece(position, PieceEnum.Cow);
                } else if (TileEnum.Red_Spawn <= grid[r][c] && grid[r][c] <= TileEnum.Purple_Spawn) {
                    // If it's a UFO spawn, spawn the corresponding enemy type
                    this.createPiece(position, grid[r][c] - TileEnum.Red_Spawn + PieceEnum.Player_Red)
                } else if (grid[r][c] >= TileEnum.Red_Enemy_Spawn) {
                    // If it's an enemy spawner, spawn the corresponding enemy type
                    this.createPiece(position, grid[r][c] - TileEnum.Red_Enemy_Spawn + PieceEnum.Enemy_Red);
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
                // If drag onto a tile, and able to purchase a ufo on that location
                if (this.game.totalScore > 0 && 
                    this.colorAtMatchingDestination(position, this.game.playerColor) &&
                    this.getPiecesByPosition(position).length == 0) {
                        server.purchaseUFO(position, this.game.playerColor);
                        this.game.moveQueue.enqueue({"moveType": MoveType.PurchaseUFO, "moveData": position, "color": this.game.playerColor, "animated": true})
                    }
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
        this.setPieceLocation(piece, position, false);
        this.pieces.push(piece);
        this.piecesContainer.addChild(piece);

        if ((PieceEnum.Player_Red <= pieceType)
         && (pieceType <= PieceEnum.Player_Purple)) {
            this.playerPieces[pieceType] += 1;
            this.game.players[pieceType - 1].setUnits(
                this.playerPieces[pieceType]
            );
        }
    }

    /**  Moves piece */
    public setPieceLocation(piece: Piece, position: Position, animated: boolean) {
        const viewPosition = this.getViewPosition(position);
        piece.row = position.row;
        piece.column = position.column;

        // Actually display pieces at the right location
        piece.animateMove(viewPosition.x - 8 * this.tileSize / 4, viewPosition.y - 8 * this.tileSize / 4, animated)
    }

    /**  Return visual piece location on the board */
    public getViewPosition(position: Position) {
        const dy = position.row * this.tileSize;
        const dx = position.column * this.tileSize;
        return { x: dx, y: dy };
    }

    /** 
     * Return a list of all pieces at a position
     * Optional argument for team type.
     */
    public getPiecesByPosition(position: Position, team: number = -1) {
        // console.log(`Getting piece at ${[position.row, position.column]}`);
        let pieceList = [];
        for (const piece of this.pieces) {
            if (piece.row === position.row && piece.column === position.column && (team == -1 || team == getTeam(piece.type))) {
                pieceList.push(piece);
            }
        }
        return pieceList;
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
        if (position.row < 0 || position.row >= this.rows || position.column < 0 || position.column >= this.columns) return TileEnum.Impassible;
        return this.grid[position.row][position.column];
    }

    public colorAtMatchingDestination(position: Position, color: number) {
        const tileOffsetToRed = this.game.board.getTileAtPosition(position) - color + PieceEnum.Player_Red;
        return (tileOffsetToRed == TileEnum.Red_Destination || tileOffsetToRed == TileEnum.Red_Spawn)
    }

    public spawnCows(turnCount: number) {
        const spawn_rate = this.game.gameSettings.getValue("cow_regen_rate");

        // Loop through pasture tiles that need new cows
        this.pastureRegen[turnCount % spawn_rate].forEach((tilePosition) => {
            this.createPiece(tilePosition, PieceEnum.Cow);
            let tile = tilePosition.row * 16 + tilePosition.column;
            this.respawnCounter[tile].text = "";
        });
        this.pastureRegen[turnCount % spawn_rate] = [];

        // Update spawn numbers
        for (let i = 0; i < spawn_rate; i++) {
            //console.log(`(turnCount + i) % COW_REGEN_RATE = ${(turnCount + i) % COW_REGEN_RATE}`);
            this.pastureRegen[(turnCount + i) % spawn_rate].forEach((tilePosition) => {
                //console.log(`Tile Position is : ${tilePosition.row}, ${tilePosition.column}`);
                //console.log(`^^^ respawns in ${(COW_REGEN_RATE - turnCount) % COW_REGEN_RATE} days`);
                let days = ((turnCount + i) % spawn_rate) - turnCount % spawn_rate;
                //let days = (COW_REGEN_RATE - i) % COW_REGEN_RATE
                if (days < 0) {
                    days += spawn_rate;
                }
                let view = this.getViewPosition(tilePosition);
                let tile = tilePosition.row * 16 + tilePosition.column;
                //console.log(`Tile num: ${tile}`);
                this.respawnCounter[tile].visible = true;
                this.respawnCounter[tile].text = days;
                this.respawnCounter[tile].x = view.x + this.tileSize * 0.5;
                this.respawnCounter[tile].y = view.y + this.tileSize * 0.5;         
            });
        }
    }

    public spawnEnemies() {
        for (let i = 0; i < 4; i++) {
            this.enemyRegen[i].forEach((tilePosition) => {
                if (this.getPiecesByPosition(tilePosition).length == 0) {
                    this.createPiece(tilePosition, PieceEnum.Enemy_Red + i);
                    this.game.AI.setUnits(this.game.AI.getUnits() + 1);
                }
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
        this.game.scorePoints(-1);
        this.createPiece(position, color);
        SoundHandler.playSFX("ufo-purchased.ogg");

    }
}
