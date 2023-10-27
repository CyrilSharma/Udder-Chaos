import { Container, Graphics } from 'pixi.js';
import { Game } from '../game/Game';
import { createRandomGrid, PieceEnum, GameConfig, loadMap, getTeam, TeamEnum, random } from '../game/Utils';
import { MAPS } from "../maps/Maps"

export class GameScreen extends Container {
    public readonly background: Graphics;
    public readonly gameContainer: Container;
    public readonly game: Game;
    constructor() {
        super();
        this.background = new Graphics()
            .beginFill(0x303030)
            ;
        this.addChild(this.background);
        this.game = new Game();
        this.gameContainer = new Container();
        this.addChild(this.gameContainer);
        this.gameContainer.addChild(this.game);
        this.addChild(this.gameContainer);
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
                [{ row: 4, column: 4 }, { row: 4, column: 5 }, { row: 5, column: 4 }, { row: 5, column: 5 }],
                [{ row: 4, column: 10 }, { row: 4, column: 11 }, { row: 5, column: 10 }, { row: 5, column: 11 }],
                [{ row: 10, column: 4 }, { row: 10, column: 5 }, { row: 11, column: 4 }, { row: 11, column: 5 }],
                [{ row: 10, column: 10 }, { row: 10, column: 11 }, { row: 11, column: 10 }, { row: 11, column: 11 }],
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

    public playCard(cardIndex: number, color: number) {
        console.log("screen Playing card: " + cardIndex);
        let card = this.game.cards.findCardInHand(cardIndex, color);
        this.game.cards.playCard(card, color);
        this.game.updateTurn();
    }

    public rotateCard(cardIndex: number, rotation: number, color: number) {
        let card = this.game.cards.findCardInHand(cardIndex, color);
        card.rotateCard(rotation);
        this.game.updateTurn();
    }

    public setPlayerColor(color: number) {
        this.game.setPlayerColor(color);
    }

    public resize(width: number, height: number) {
        console.log("width: " + width);
        const centerx = width / 2;
        const centery = height / 2;
        this.game.x = centerx - this.game.board.getWidth() / 2;
        this.background.drawRect(0, 0, width, height);
    }
}
