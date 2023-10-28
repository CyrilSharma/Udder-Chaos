import { Container, Sprite } from 'pixi.js';
import { Board } from './Board';
import { ColorEnum, GameConfig } from './Utils';
import { app } from '../main';
import { CardQueue } from './CardQueue';
import { GameUpdate } from './GameUpdate';
import { GameState } from './GameState';
// This seems a little redundant right now,
// But it will house the cards as well,
// And provide some callbacks maybe.
export class Game extends Container {
    public board: Board;
    public cards: CardQueue;
    public gameState: GameState;
    public config!: GameConfig;
    public playerColor!: number;
    public updateList: GameUpdate[] = [];
    public turn: number = 1;
    public turnCount: number = 0;
    public dayCount: number = 0;
    public turnLimit: number = 10; //debug limit - includes AI turns (simplest)
    public totalScore: number = 0;
    constructor() {
        super();
        this.board = new Board(this);
        this.cards = new CardQueue(this);
        this.gameState = new GameState(this);
        this.addChild(this.board);
        this.addChild(this.cards);
        this.addChild(this.gameState);
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
        this.turn += 1;
        if (this.turn > 6) {
            this.turn -= 6;
            this.dayCount++;
        }
        console.log(`turn: ${this.turn}`);
        this.gameState.updateTurn(this.turn);
        
        console.log(`turnCount: ${this.turnCount}`);
        this.turnCount += 1;
        if (this.turnCount == this.turnLimit) {
            this.endGame();
        }
    }

    // All the end game functionality will go here :D
    // Actually not much to do on the game side since the board is
    // reset when a new game is setup rather than when the old one finishes
    public endGame() {
        console.log("I am ending the game");
        console.log("etc etc");
        this.board.endGame();
    }

    public ourTurn() {
        return this.playerColor == 1 && this.turn == 1 || 
                this.playerColor == 2 && this.turn == 2 || 
                this.playerColor == 3 && this.turn == 4 ||
                this.playerColor == 4 && this.turn == 5;
        return true; // debug always allow current player to move
    }

    public scorePoints(points: number) {
        this.totalScore += points;
        this.gameState.updateScore(this.totalScore);
    }
}
