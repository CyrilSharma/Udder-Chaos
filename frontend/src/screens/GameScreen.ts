import { Container, Graphics } from 'pixi.js';
import { Game } from '../game/Game';
import { createRandomGrid, PieceEnum, GameConfig, loadMap, getTeam, TeamEnum, random, Position } from '../game/Utils';
import { MAPS } from "../maps/Maps"
import { Background } from '../ui_components/Background';

export class GameScreen extends Container {
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
        // Get rid of this!!!
        const config: GameConfig = {
            grid: loadMap(Math.floor(random()*MAPS.length)),
            starts: [
                [],
                [{ row: 0, column: 0 }, { row: 0, column: 1 }, { row: 1, column: 0 }, { row: 1, column: 1 }],
                [{ row: 0, column: 14 }, { row: 0, column: 15 }, { row: 1, column: 14 }, { row: 1, column: 15 }],
                [{ row: 14, column: 0 }, { row: 14, column: 1 }, { row: 15, column: 0 }, { row: 15, column: 1 }],
                [{ row: 14, column: 14 }, { row: 14, column: 15 }, { row: 15, column: 14 }, { row: 15, column: 15 }],
                [],
                [],
                [],
                [],
            ],
            tileSize: 40,
        };
        this.game.setup(config);
    }

    public async playCard(cardIndex: number, color: number) {
        console.log("screen Playing card: " + cardIndex);
        let card = this.game.cards.findCardInHand(cardIndex, color);
        await this.game.cards.playCard(card, color);
        this.game.updateTurn();
    }

    public rotateCard(cardIndex: number, rotation: number, color: number) {
        let card = this.game.cards.findCardInHand(cardIndex, color);
        card.rotateCard(rotation - card.cardRotation);
        this.game.updateTurn();
    }

    public purchaseUFO(position: Position, color: number) {
        this.game.board.purchaseUFO(position, color);
    }

    public setPlayerColor(color: number) {
        this.game.setPlayerColor(color);
    }

    public resize(width: number, height: number) {
        this.background.resize(width, height);
        this.game.resize(width, height);        
    }
}
