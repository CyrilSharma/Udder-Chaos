import { Container, Graphics, Sprite } from 'pixi.js';
import { Piece } from './Piece';
import { Game } from './Game';
import { Card } from './Card';
import {
    Position,
    GameConfig,
    PieceEnum,
    PieceType,
    TileType,
    TileEnum,
    TileMap,
    PieceMap,
    isPlayer,
    DirectionEnum,
    GameUpdate,
    ColorEnum
} from './Utils';

export class CardQueue extends Container {
    public game: Game;
    public queue: Card[] = [];
    public player_hand: Card[] = [];
    public enemy_hand: Card[] = [];
    public cardContainer: Container;
    public cardSize = 100;
    public ncards = 16;

    constructor(game: Game) {
        super();
        this.game = game;
        this.cardContainer = new Container();
        this.addChild(this.cardContainer);
    }

    public setup() {
        const board_width = this.game.board.getWidth();
        const interval = board_width / this.ncards;
        for (let i = 0; i < this.ncards; i++) {
            let config = {
                color: ColorEnum.RED,
                dir: DirectionEnum.UP,
                size: 50
            };
            let card = new Card(this, config, i);
            this.cardContainer.addChild(card);
            card.y = 0;
            card.x = interval * i;
            if (i < 3) {
                this.player_hand.push(card)
            } else if (i >= this.ncards - 3) {
                this.enemy_hand.push(card)
            } else {
                this.queue.push(card);
            }
        }
    }

    public bringCardToTop(card: Card) {
        this.cardContainer.addChild(card);
    }

    public placeCardBack() {
        for (const card of this.player_hand) {
            this.cardContainer.addChild(card);
        }
        for (const card of this.queue) {
            this.cardContainer.addChild(card);
        }
        for (const card of this.enemy_hand) {
            this.cardContainer.addChild(card);
        }
    }
}