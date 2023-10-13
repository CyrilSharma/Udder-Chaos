import { Container, Sprite } from 'pixi.js';
import { Board } from './Board';
import { GameConfig } from './Utils';
import { app } from '../main';
import { CardQueue } from './CardQueue';
import { GameUpdate } from './GameUpdate';
// This seems a little redundant right now,
// But it will house the cards as well,
// And provide some callbacks maybe.
export class Game extends Container {
    public board: Board;
    public cards: CardQueue;
    public config!: GameConfig;
    public playerColor!: number;
    public updateList: GameUpdate[] = [];
    public turn: number = 1;
    constructor() {
        super();
        this.board = new Board(this);
        this.cards = new CardQueue(this);
        this.addChild(this.board);
        this.addChild(this.cards);
    }

    public setup(config: GameConfig) {
        this.config = config;
        this.board.setup(config);
        this.cards.setup();
        this.cards.y = this.board.getHeight();
    }

    public setPlayerColor(color: number) {
        this.playerColor = color;
    }

    public updateTurn() {
        this.turn += 1;
        if (this.turn > 3) this.turn -= 3;
    }

    public ourTurn() {
        return this.turn == this.playerColor;
    }
}
