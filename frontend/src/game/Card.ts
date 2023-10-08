import { Container, FederatedPointerEvent, Graphics, Sprite } from 'pixi.js';
import { Direction, Color } from './Utils';
import { CardQueue } from './CardQueue';

export type CardOptions = {
    color: Color
    dir: Direction;
    size: number;
};
export class Card extends Container {
    public readonly queue: CardQueue;
    public readonly graphics: Graphics
    public index: number
    constructor(queue: CardQueue, options: CardOptions, index: number) {
        super();
        this.queue = queue;
        this.index = index;
        this.graphics = new Graphics();
        this.graphics.beginFill(0xFFFFFF);
        // set the line style to have a width of 5 and set the color to red
        this.graphics.lineStyle(5, 0xFF0000);
        // draw a card
        this.graphics.drawRoundedRect(
            0, 0, options.size, options.size * 1.4, 10
        );
        this.addChild(this.graphics);
        console.log("YO YO YO");
        this.graphics.interactive = true;
        this.graphics.on('pointerup', () => console.log("ATTEMPT 1"));
        this.graphics.on('pointerdown', () => console.log("ATTEMPT 1"));
        this.graphics.on('pointerover', this.onPointerOver);
        this.graphics.on('pointerout', this.onPointerOut);
        console.log(this.graphics);
    }

    private onPointerOver = (e: FederatedPointerEvent) => {
        console.log("Hover over card " + this.index);
        this.queue.bringCardToTop(this);
    };

    private onPointerOut = (e: FederatedPointerEvent) => {
        console.log("Leave over card " + this.index);
        this.queue.placeCardBack();
    };
}
