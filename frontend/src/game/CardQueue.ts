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

export class CardQueue {
    public game: Game;
    public queue: Card[] = [];
    public player_hand: Card[] = [];
    public enemy_hand: Card[] = [];
    public cardContainer: Container;
    public cardSize = 100;

    constructor(game: Game) {
        this.game = game;
        this.cardContainer = new Container();
        //this.game.addChild(Sprite.from("raw-assets/player_red.png"));
        this.game.addChild(this.cardContainer);
        const ncards = 16;
        for (let i = 0; i < ncards; i++) {
            let card = new Card({
                color: ColorEnum.RED,
                dir: DirectionEnum.UP,
                size: 50
            });
            this.cardContainer.addChild(card);
            card.y = 0;
            card.x = 20 * i;
            if (i < 3) {
                this.player_hand.push(card)
            }
            else if (i >= ncards - 3) {
                this.enemy_hand.push(card)
            }
            else {
                this.queue.push(card);
            }
        }
    }
}