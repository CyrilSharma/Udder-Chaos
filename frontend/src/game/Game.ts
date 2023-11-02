import { Container, Sprite, Text } from 'pixi.js';
import { Board } from './Board';
import { ColorEnum, GameConfig, COW_REGEN_RATE, COW_SACRIFICE, SCORE_GOAL, PieceEnum } from './Utils';
import { app } from '../main';
import { CardQueue } from './CardQueue';
import { GameUpdate } from './GameUpdate';
import { GameState } from './GameState';
import { BuyButton } from '../ui_components/BuyButton';

// This seems a little redundant right now,
// But it will house the cards as well,
// And provide some callbacks maybe.
const DAYS_PER_ROUND = 3;

export class Game extends Container {
    public board: Board;
    public cards: CardQueue;
    public gameState: GameState;
    public config!: GameConfig;
    public playerColor!: number;
    public updateList: GameUpdate[] = [];
    public turn: number = 1;
    public turnCount: number = 0;
    public dayCycle: number = 0;
    public totalDayCount: number = 0;
    public totalScore: number = 0;
    public buyButton: BuyButton;
    public gameOver: boolean = false;

    constructor() {
        super();

        this.board = new Board(this);
        this.cards = new CardQueue(this);
        this.gameState = new GameState(this);
        this.buyButton = new BuyButton("Buy", -100, -1, 0xffcc66, 1, 0.1, 30);

        this.addChild(this.board);
        this.addChild(this.cards);
        this.addChild(this.gameState);
        this.addChild(this.buyButton);
    }

    public setup(config: GameConfig) {
        this.config = config;
        this.board.setup(config);
        this.cards.setup();
        this.cards.y = this.board.getHeight();
        this.gameState.setup();
        this.gameState.y = this.cards.y + this.cards.height;
    }

    public setPlayerColor(color: number) {
        this.playerColor = color;
        this.gameState.updateColor(color);
    }

    public updateTurn() {
        if (this.gameOver) {
            return;
        }

        this.turn += 1;
        if (this.turn > 6) {
            this.turn -= 6;
            this.dayCycle++;
            if (this.dayCycle >= DAYS_PER_ROUND) {
                this.dayCycle -= DAYS_PER_ROUND;
                this.startNewRound();
            }
            this.totalDayCount++;
            this.gameState.updateDay(this.totalDayCount);
        }
        this.gameState.updateTurn(this.turn);
        this.turnCount += 1;
        this.board.spawnCows(this.turnCount);
    }

    public startNewRound() {
        console.log("New round starting!");
        
        this.cowSacrifice();
        this.board.spawnEnemies();
    }

    public cowSacrifice() {
        if (this.totalScore >= COW_SACRIFICE) {
            this.totalScore -= COW_SACRIFICE;
            this.gameState.updateScore(this.totalScore);
        }
        else {
            console.log("Failed to sacrifice enough cows!")
            this.endGame(false, "You failed to sacrifice enough cows to Homeworld.");
        }
    }

    // All the end game functionality will go here :D
    // Actually not much to do on the game side since the board is
    // reset when a new game is setup rather than when the old one finishes
    public endGame(success: boolean, message: string) {
        console.log(message);
        this.board.endGame(success, message);
        this.gameOver = true;
    }

    public ourTurn() {
        //return !this.gameOver;
        return !this.gameOver && 
            this.playerColor == 1 && this.turn == 1 || 
            this.playerColor == 2 && this.turn == 2 || 
            this.playerColor == 3 && this.turn == 4 ||
            this.playerColor == 4 && this.turn == 5;
        return !this.gameOver; // debug always allow current player to move
    }

    public scorePoints(points: number) {
        this.totalScore += points;
        this.gameState.updateScore(this.totalScore);
        if (this.totalScore >= SCORE_GOAL) {
            this.endGame(true, "You saved Homeworld with enough cows!")
        }
    }
}
