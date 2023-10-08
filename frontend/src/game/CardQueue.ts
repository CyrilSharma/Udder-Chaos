import { Container, Graphics, Sprite } from 'pixi.js';
import { Piece } from './Piece';
import { Game } from './Game';
import { Card } from './Card';
import {
    DirectionEnum,
    ColorEnum,
    PieceMove
} from './Utils';

export class CardQueue extends Container {
    public game: Game;
    public queue: Card[] = [];
    public player_hand: Card[] = [];
    public enemy_hand: Card[] = [];
    public cardContainer: Container;
    public cardSize = 100;
    public ncards = 16;
    public hand_size = 3;

    constructor(game: Game) {
        super();
        this.game = game;
        this.cardContainer = new Container();
        this.addChild(this.cardContainer);
    }

    public setup() {
        let directions = [
            DirectionEnum.LEFT,
            DirectionEnum.RIGHT,
            DirectionEnum.DOWN,
            DirectionEnum.UP,
        ]
        let get = () => directions[
            Math.floor(Math.random() * directions.length)
        ];
        for (let i = 0; i < this.ncards; i++) {
            let config = {
                color: ColorEnum.RED,
                dir: get(),
                size: 50
            };
            let card = new Card(this, config, i);
            this.cardContainer.addChild(card);
            if (i < 3) {
                this.player_hand.push(card)
            } else if (i < this.ncards - 3) {
                this.queue.push(card);
            } else {
                this.enemy_hand.push(card)
            }
        }
        this.placeCards();
    }

    public playCard(input: Card) {
        for (let i = 0; i <  this.player_hand.length; i++) {
            let card = this.player_hand[i];
            if (card != input) continue;

            // VERY VERY TEMPORARY CHANGE.
            let dir = -1;
            switch(card.dir) {
                case DirectionEnum.RIGHT: { dir=0; break; }
                case DirectionEnum.UP:    { dir=1; break; }
                case DirectionEnum.LEFT:  { dir=2; break; }
                case DirectionEnum.DOWN:  { dir=3; break; }
            }
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

            this.player_hand.splice(i, 1);
            this.player_hand.push(this.queue[0]);
            console.log(this.queue.shift());
            this.queue.push(card);
            this.placeCards();
            return;
        }
        for (const card of this.queue) {
            if (card != input) continue;
            return;
        }
        // For now, assume we don't animate enemy cards.
        for (const card of this.enemy_hand) {
            if (card != input) continue;
            return;
        }
    }

    public bringCardToTop(card: Card) {
        this.cardContainer.addChild(card);
    }

    public placeCards() {
        let count = 0;
        let index = 0;
        const board_width = this.game.board.getWidth();
        const interval = board_width / (this.ncards + 2);
        for (const card of this.player_hand) {
            ///card.index = index++;
            card.x = interval * (count++);
            this.cardContainer.addChild(card);
        }
        count++;
        for (const card of this.queue) {
            ///card.index = index++;
            card.x = interval * (count++);
            this.cardContainer.addChild(card);
        }
        count++;
        for (const card of this.enemy_hand) {
            ///card.index = index++;
            card.x = interval * (count++);
            this.cardContainer.addChild(card);
        }
    }
}