import { Container } from 'pixi.js'
import { Board } from './Board'
import { GameConfig } from './Utils'
// This seems a little redundant right now,
// But it will house the cards as well,
// And provide some callbacks maybe.
export class Game extends Container {
    public board: Board;
    public config!: GameConfig;
    constructor() {
        super();
        this.board = new Board(this);
    }

    public setup(config: GameConfig) {
        this.config = config;
        this.board.setup(config);
    }
}