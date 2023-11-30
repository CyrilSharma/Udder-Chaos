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
import { SoundHandler } from './SoundHandler';

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

        this.placeCards(false);
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
            
            // found card
            SoundHandler.playSFX("card-play.ogg");

            // animate card
            const midX = this.game.boardPanel.x;
            const midY = this.game.boardPanel.y;

            const newX = this.game.rightPanel.x;
            const newY = this.game.rightPanel.y - this.game.rightPanel.height * 0.29 + (this.queue.length) * this.queue[i].size * 0.7;
            
            if (animated) {
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
                await gsap.to(card, {
                    pixi: {rotation: 0},
                    duration: 0.1,
                    ease: "sine.inOut",
                    delay: 0.55
                })
                gsap.to(card, {
                    pixi: {x: newX, y: newY, scale: 1},
                    duration: 0.5,
                    ease: "power2.in",
                    delay: 0.35
                })
            }

            // Remove card from hand and add to queue
            this.queue.push(card);

            // Get new card from queue
            hand[i] = this.queue.shift()!;
            
            // Fix card hands and queue, rerender
            await this.placeCards(animated);
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
    public async placeCards(animated: boolean) {
        if (animated) {
            await new Promise(r => setTimeout(r, 350))
        }
        
        // Draw Player Hand
        let pos = -1;
        for (const card of this.player_hand) {
            const newX = this.game.bottomPanel.x + pos * this.game.bottomPanel.width * 0.4;
            const newY = this.game.bottomPanel.y;

            if (animated) {
                gsap.to(card, {
                    pixi: {x: newX, y: newY},
                    duration: 0.5,
                    ease: "power2.in"
                })
            } else {
                card.x = newX;
                card.y = newY;
            }
            
            this.cardContainer.addChild(card);
            pos++;
        }

        pos = this.queue.length;
        for (let i = this.queue.length - 1; i >= 0; i--) {
            if (i == 0) {
                pos--;
            }
            const newX = this.game.rightPanel.x;
            const newY = this.game.rightPanel.y - this.game.rightPanel.height * 0.29 + (pos) * this.queue[i].size * 0.7;
            
            if (animated) {
                if (pos < this.queue.length) {
                    gsap.to(this.queue[i], {
                        pixi: {x: newX, y: newY},
                        duration: 0.5,
                        ease: "back.out"
                    })
                }
            } else {
                this.queue[i].x = newX;
                this.queue[i].y = newY;
            }
            
            this.cardContainer.addChild(this.queue[i]);
            pos--;
        }

        // Draw enemy hand
        pos = -1;
        for (const card of this.enemy_hand) {
            const newX = this.game.rightPanel.x + pos * this.game.rightPanel.width * 0.2;
            const newY = this.game.bottomPanel.y;

            if (animated) {
                gsap.to(card, {
                    pixi: {x: newX, y: newY},
                    duration: 0.5,
                    ease: "power2.in"
                })
            } else {
                card.x = newX;
                card.y = newY;
            }

            this.cardContainer.addChild(card);
            pos++;
        }

        if (animated) {
            await new Promise(r => setTimeout(r, 500))
        }
    }
}