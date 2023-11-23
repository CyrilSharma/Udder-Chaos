import { Container, Graphics, Sprite } from 'pixi.js';
import { Game } from './Game';
import { Card } from './Card';
import { LogicHandler } from './LogicHandler';
import {
    DirectionEnum,
    ColorEnum,
    Position,
    TileEnum,
    TeamEnum,
    getTeam,
    shuffle,
    random
} from './Utils';
import { CARD_PRESETS } from '../maps/Cards'
import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { PixiPlugin } from "gsap/PixiPlugin";

// register the plugin
gsap.registerPlugin(PixiPlugin);
gsap.registerPlugin(CustomEase);

// give the plugin a reference to the PIXI object
PixiPlugin.registerPIXI(PIXI);


/** Stores all the cards in the game, handles card playing with a logic handler */
export class CardQueue extends Container {
    public game: Game;
    public queue: Card[] = [];
    public player_hand: Card[] = [];
    public enemy_hand: Card[] = [];
    public cardContainer: Container;
    public logicHandler: LogicHandler;
    public cardSize = 100;
    public ncards = 0;
    public hand_size: number = 3;

    constructor(game: Game) {
        super();
        this.game = game;
        this.ncards = this.game.gameSettings.getValue("card_deck_size");
        this.logicHandler = new LogicHandler(game);
        this.cardContainer = new Container();
        this.addChild(this.cardContainer);
    }

    public setup() {
        for (let i = 0; i < this.ncards; i++) {
            let config = {
                color: ColorEnum.RED,
                dirs: Array.from(CARD_PRESETS[i % CARD_PRESETS.length]),
                size: 50,
                rotation: Math.floor(random() * 4),
            };
            //console.log(config);
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

    /** Called when a card in the cardqueue is clicked */
    public async playCard(input: Card, color: number, animated: boolean) {
        // Get correct team
        var hand;
        if (getTeam(color) == TeamEnum.Player) {
            hand = this.player_hand;
        } else if (getTeam(color) == TeamEnum.Enemy) {
            hand = this.enemy_hand;
        } else {
            throw Error(`Invalid player color: ${color}`);
        }
        // Find card and play it, check that it's actually in hand
        for (let i = 0; i < hand.length; i++) {
            let card = hand[i];
            if (card != input) continue;

            const midX = this.game.boardPanel.x;
            const midY = this.game.boardPanel.y;

            const newX = this.game.rightPanel.x;
            const newY = this.game.rightPanel.y - this.game.rightPanel.height * 0.29 + (this.queue.length) * this.queue[i].height * 0.7;
            
            gsap.to(card, {
                pixi: {x: midX, y: midY, scale: 2},
                duration: 0.25,
                ease: "power2.out"
            })
            gsap.to(card, {
                pixi: {rotation: 20},
                duration: 0.05,
                ease: "sine.out",
                delay: 0.2
            })
            gsap.to(card, {
                pixi: {rotation: -20},
                duration: 0.1,
                ease: "sine.inOut",
                delay: 0.25
            })
            gsap.to(card, {
                pixi: {rotation: 10},
                duration: 0.1,
                ease: "sine.inOut",
                delay: 0.35
            })
            gsap.to(card, {
                pixi: {rotation: -5},
                duration: 0.1,
                ease: "sine.inOut",
                delay: 0.45
            })
            gsap.to(card, {
                pixi: {rotation: 0},
                duration: 0.1,
                ease: "sine.inOut",
                delay: 0.55
            })
            await gsap.to(card, {
                pixi: {x: newX, y: newY, scale: 1},
                duration: 0.25,
                ease: "power2.in",
                delay: 1
            })

            // Remove card from hand and add to queue
            this.queue.push(card);

            // Get new card from queue
            hand[i] = this.queue.shift()!;
            
            // Fix card hands and queue, rerender
            this.placeCards();
            this.reindexCards();
            
            // Use logic handler to process movement logic
            await this.logicHandler.playCard(card, color, animated);

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

    public checkCardInHand(input: Card, color: number) {
        // Get correct team
        var hand;
        if (getTeam(color) == TeamEnum.Player) {
            hand = this.player_hand;
        } else if (getTeam(color) == TeamEnum.Enemy) {
            hand = this.enemy_hand;
        } else {
            throw Error(`Invalid player color: ${color}`);
        }
        // Find card and play it, check that it's actually in hand
        for (let i = 0; i < hand.length; i++) {
            let card = hand[i];
            if (card != input) continue;
            return true;
        }

        return false;
    }

    /** Index each card by its position. Queue and hands are numbered from 0 */
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

    /** Redraw all cards */
    public placeCards() {

        // Draw Player Hand
        let pos = -1;
        for (const card of this.player_hand) {
            const newX = this.game.bottomPanel.x + pos * this.game.bottomPanel.width * 0.4;
            const newY = this.game.bottomPanel.y;

            gsap.to(card, {
                pixi: {x: newX},
                duration: 0.8,
                ease: "power2.out"
            })
            gsap.to(card, {
                pixi: {y: newY},
                duration: 0.8,
                ease: CustomEase.create("custom", "M0,0 C0,0 0.023,-0.086 0.066,-0.132 0.106,-0.175 0.157,-0.197 0.198,-0.197 0.238,-0.197 0.25,-0.2 0.3,-0.183 0.31,-0.179 0.358,-0.145 0.382,-0.122 0.412,-0.09 0.43,-0.06 0.442,-0.036 0.456,-0.008 0.467,0.01 0.478,0.047 0.492,0.092 0.512,0.18 0.525,0.238 0.549,0.349 0.561,0.445 0.584,0.596 0.591,0.648 0.605,0.819 0.639,0.92 0.674,1.027 0.667,1.011 0.702,1.057 0.744,1.113 0.76,1.114 0.814,1.114 0.855,1.114 0.862,1.12 0.888,1.096 0.914,1.07 0.908,1.047 0.945,1.015 0.96,1 1,1 1,1 "),
            })
            this.cardContainer.addChild(card);
            pos++;
        }

        pos = this.queue.length;
        for (let i = this.queue.length - 1; i >= 0; i--) {
            if (i == 0) {
                pos--;
            }
            const newX = this.game.rightPanel.x;
            const newY = this.game.rightPanel.y - this.game.rightPanel.height * 0.29 + (pos) * this.queue[i].height * 0.7;
            
            gsap.to(this.queue[i], {
                pixi: {x: newX, y: newY},
                duration: 0.8,
                ease: CustomEase.create("custom", "M0,0 C0,0 0.061,0.34 0.085,0.447 0.105,0.539 0.149,0.715 0.175,0.795 0.195,0.861 0.239,0.98 0.265,1.032 0.287,1.077 0.334,1.165 0.365,1.185 0.418,1.218 0.472,1.233 0.515,1.243 0.562,1.253 0.617,1.241 0.664,1.241 0.704,1.241 0.74,1.22 0.789,1.196 0.842,1.168 0.862,1.159 0.915,1.124 0.96,1.093 1,1 1,1 "),
            })

            this.cardContainer.addChild(this.queue[i]);
            pos--;
        }

        // Draw enemy hand
        pos = -1;
        for (const card of this.enemy_hand) {
            const newX = this.game.rightPanel.x + pos * this.game.rightPanel.width * 0.2;
            const newY = this.game.bottomPanel.y;-

            gsap.to(card, {
                pixi: {x: newX, y: newY},
                duration: 0.8,
                ease: "back.out"
            })

            this.cardContainer.addChild(card);
            pos++;
        }
    }
}