import { Container, Graphics } from 'pixi.js';
import { Game } from '../game/Game';
import { GameConfig, loadMap, random, Position, PlayerInfo } from '../game/Utils';
import { MAPS } from "../maps/Maps"
import { Background } from '../ui_components/Background';

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
        // Temporary workaround until we can load maps.

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

    // Move function only used for debug purposes right now (arrow key calls from main)
    // Deprecated debug movement
    // public move(dir: number) {
    //     let dx = [1, 0, -1, 0];
    //     let dy = [0, -1, 0, 1];
    //     let normal_moves: PieceMove[] = [];
    //     this.game.board.pieces.forEach((piece) => {
    //         if (piece.type != PieceEnum.Enemy_Red) return;
    //         let cur = { row: piece.row, column: piece.column };
    //         let dest = { row: piece.row + dy[dir], column: piece.column + dx[dir] };
    //         normal_moves.push({ from: cur, to: dest });
    //     });

    //     this.game.board.updateGame({
    //         normal_moves,
    //         kill_moves: [],
    //         score_moves: [],
    //     });
    // }

    // public async playCard(cardIndex: number, color: number) {
    //     console.log("screen Playing card: " + cardIndex);
    //     let card = this.game.cards.findCardInHand(cardIndex, color);
    //     await this.game.cards.playCard(card, color);
    //     this.game.updateTurn();
    // }

    // public async rotateCard(cardIndex: number, rotation: number, color: number) {
    //     let card = this.game.cards.findCardInHand(cardIndex, color);
    //     await card.rotateCard(rotation - card.cardRotation);
    //     this.game.updateTurn();
    // }

    // public async purchaseUFO(position: Position, color: number) {
    //     await this.game.board.purchaseUFO(position, color);
    //     this.game.updateTurn();
    // }

    public setPlayerColor(color: number) {
        this.game.setPlayerColor(color);
    }

    public resize(width: number, height: number) {
        this.background.resize(width, height);
        this.game.resize(width, height);        
    }
}
