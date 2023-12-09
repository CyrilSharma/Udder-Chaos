import { Container, Graphics } from 'pixi.js';
import { Game } from '../game/Game';
import { GameConfig, loadMap, random, Position, PlayerInfo } from '../game/Utils';
import { MAPS } from "../maps/Maps"
import { Background } from '../ui_components/Background';
import { gameSettings } from "../game/GameSettings";

export class GameScreen extends Container {
    public SCREEN_ID = 'game';
    public readonly background: Background;
    public readonly game: Game;
    constructor() {
        super();
       
        this.background = new Background();
        this.addChild(this.background);

        this.game = new Game();
        this.addChild(this.game);
    }

    public prepare() {
        const config: GameConfig = {
            grid: loadMap(gameSettings.getValue("map_id")),
            tileSize: 40,
        };
        this.game.setup(config);
    }

    public setPlayerColor(color: number) {
        this.game.setPlayerColor(color);
    }

    public resize(width: number, height: number) {
        this.background.resize(width, height);
        this.game.resize(width, height);        
    }
}
