import { Container, Sprite } from 'pixi.js';
import { Game } from '../game/Game';
import { createRandomGrid } from '../game/Utils';
import { app } from '../main'
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
        const config = {
            grid: createRandomGrid(),
            tileSize: 50
        }
        this.game.setup(config);
    }
}