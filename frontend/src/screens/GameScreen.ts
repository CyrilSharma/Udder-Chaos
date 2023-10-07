import { Container } from 'pixi.js';
import { Game } from '../game/Game';
import {
    createRandomGrid,
    PieceEnum,
    GameConfig
} from '../game/Utils';

export class GameScreen extends Container {
    public readonly gameContainer: Container;
    public readonly game: Game;
    constructor() {
        super();
        this.game = new Game();
        this.gameContainer = new Container();
        this.addChild(this.gameContainer);
        this.gameContainer.addChild(this.game);
    }

    public prepare() {
        const config: GameConfig = {
            grid: createRandomGrid(),
            starts: [
                [
                    { row: 0, column: 0 }
                ],
                [
                    { row: 0, column: 1 }
                ],
                [
                    { row: 0, column: 2 }
                ],
                [
                    { row: 0, column: 3 }
                ],
                [
                    { row: 0, column: 4 }
                ],
                [
                    { row: 0, column: 5 }
                ],
                [
                    { row: 0, column: 6 }
                ],
                [
                    { row: 0, column: 7 }
                ],
                [
                    { row: 0, column: 7 }
                ]
            ],
            tileSize: 50
        }
        this.game.setup(config);
    }
}