import { Container } from 'pixi.js';
import { Game } from '../game/Game';
import { createRandomGrid, PieceEnum, GameConfig, PieceMove, loadMap } from '../game/Utils';
import { MAPS } from "../maps/Maps"

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
        // Temporary workaround until we can load maps.
        const config: GameConfig = {
            grid: loadMap(Math.floor(Math.random()*MAPS.length)),
            starts: [
                [{ row: 0, column: 0 }],
                [{ row: 0, column: 1 }],
                [{ row: 0, column: 2 }],
                [{ row: 0, column: 3 }],
                [{ row: 0, column: 4 }],
                [{ row: 0, column: 5 }],
                [{ row: 0, column: 6 }],
                [{ row: 0, column: 7 }],
                [{ row: 0, column: 8 }],
            ],
            tileSize: 40,
        };
        this.game.setup(config);
    }

    public move(dir: number) {
        let dx = [1, 0, -1, 0];
        let dy = [0, -1, 0, 1];
        let normal_moves: PieceMove[] = [];
        this.game.board.pieces.forEach((piece) => {
            let cur = { row: piece.row, column: piece.column };
            let dest = { row: piece.row + dy[dir], column: piece.column + dx[dir] };
            normal_moves.push({ from: cur, to: dest });
        });
        this.game.board.updateGame({
            normal_moves,
            kill_moves: [],
            score_moves: [],
        });
    }

    public playCard(cardIndex: number) {
        let card = this.game.cards.findCardInHand(cardIndex);
        this.game.cards.playCard(card);
    }
}
