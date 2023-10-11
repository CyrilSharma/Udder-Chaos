import { Container, Graphics, Sprite } from 'pixi.js';
import { Piece } from './Piece';
import { Game } from './Game';
import { Card } from './Card';
import { LogicHandler } from './LogicHandler';
import {
    DirectionEnum,
    ColorEnum,
    PieceMove,
    Position,
    TileEnum
} from './Utils';

export class CardQueue extends Container {
    public game: Game;
    public queue: Card[] = [];
    public player_hand: Card[] = [];
    public enemy_hand: Card[] = [];
    public cardContainer: Container;
    public logicHandler: LogicHandler;
    public cardSize = 100;
    public ncards = 16;
    public hand_size = 3;

    constructor(game: Game) {
        super();
        this.game = game;
        this.logicHandler = new LogicHandler(game);
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

    public findCardInHand(index: number) {
        for (let i = 0; i <  this.player_hand.length; i++) {
            let card = this.player_hand[i];
            if (card.index == index) return card;
        }
        //ERROR
        console.log("COULDN'T FIND CARD");
        return this.player_hand[0];
    }

    public playCard(input: Card) {
        for (let i = 0; i <  this.player_hand.length; i++) {
            let card = this.player_hand[i];
            if (card != input) continue;
            console.log(input.index);

            this.logicHandler.playCard(card);

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