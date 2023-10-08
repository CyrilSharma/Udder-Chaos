import { Container, Sprite } from 'pixi.js';
import { Board } from './Board';
import { GameConfig } from './Utils';
import { app } from '../main';
import { CardQueue } from './CardQueue';
// This seems a little redundant right now,
// But it will house the cards as well,
// And provide some callbacks maybe.
export class Game extends Container {
    public board: Board;
    public cards: CardQueue;
    public config!: GameConfig;
    constructor() {
        super();
        this.board = new Board(this);
        this.cards = new CardQueue(this);
    }

    public setup(config: GameConfig) {
        this.config = config;
        this.board.setup(config);
    }
}
