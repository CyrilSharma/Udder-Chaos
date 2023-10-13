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
    TileEnum,
    TeamEnum,
    getTeam,
    shuffle
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
    public hand_size: number = 3;

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
        for (let i = 0; i < this.ncards; i++) {
            let config = {
                color: ColorEnum.RED,
                dir: i % 4, // Evenly generate a number of each card
                size: 50
            };
            let card = new Card(this, config, i);
            this.cardContainer.addChild(card);
            this.queue.push(card);
        }

        // Shuffle hand
        shuffle(this.queue);

        // Distribute cards to players and enemies
        for (let i = 0; i < this.hand_size; i++) {
            this.player_hand.push(this.queue.shift()!);
            this.enemy_hand.push(this.queue.shift()!);
        }

        console.log(this.player_hand);
        console.log(this.enemy_hand);

        this.placeCards();
        this.reindexCards();
    }

    /** Find and return the card corresponding to the index in the correct team's hand */
    public findCardInHand(index: number, color: number) {
        if (getTeam(color) == TeamEnum.Player) {
            // console.log(`Searching player hand: ${index}`)
            // for (let i = 0; i <  this.player_hand.length; i++) {
            //     let card = this.player_hand[i];
            //     if (card.index == index) return card;
            // }
            return this.player_hand[index];
        } 
        else if (getTeam(color) == TeamEnum.Enemy) {
            // console.log(`Searching enemy hand: ${index}`)
            // for (let i = 0; i <  this.enemy_hand.length; i++) {
            //     let card = this.enemy_hand[i];
            //     if (card.index == index) return card;
            // }
            return this.enemy_hand[index];
        }  
        //ERROR
        throw Error("COULDN'T FIND CARD");
        // return this.player_hand[0];
    }

    public playCard(input: Card, color: number) {
        var hand;
        if (getTeam(color) == TeamEnum.Player) {
            hand = this.player_hand;
        } else if (getTeam(color) == TeamEnum.Enemy) {
            hand = this.enemy_hand;
        } else {
            throw Error(`Invalid player color: ${color}`);
        }
        for (let i = 0; i < hand.length; i++) {
            let card = hand[i];
            if (card != input) continue;

            this.logicHandler.playCard(card, color);

            hand.splice(i, 1);
            hand.push(this.queue.shift()!);
            this.queue.push(card);
            
            this.placeCards();
            this.reindexCards();
            return;
        }

        console.log("Card not found");
        // for (const card of this.queue) {
        //     if (card != input) continue;
        //     return;
        // }

        // // For now, assume we don't animate enemy cards.
        // for (const card of this.enemy_hand) {
        //     if (card != input) continue;
        //     return;
        // }
    }

    public reindexCards() {
        for (let i = 0; i < this.hand_size; i++) {
            this.player_hand[i].index = i;
            this.enemy_hand[i].index = i;
        }
        for (let i = 0; i < this.queue.length; i++) {
            this.queue[i].index = i;
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