import { Container } from "pixi.js";
import { Card } from "./Card";

export class Queue extends Container {
    
    /** Color of this card queue */
    public color!: number;

    /** Contains queue of Card objects */
    public cardQueue: Card[] = [];

    constructor() {
        super();
    }

    /** 
     * Create a new card queue based on a list of cards
     * Performs a deep copy of the given card list 
     */
    public fill(cardList: Card[]) {
        this.cardQueue = structuredClone(cardList);
    }

    /** Receives played card and removes and returns new one from front of queue */
    public addCard(card: Card) {
        this.cardQueue.push(card);
        return this.cardQueue.shift();
    }
}