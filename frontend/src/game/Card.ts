import { Container, Graphics, Sprite } from 'pixi.js';
import { Direction, Color } from './Utils';

export type CardOptions = {
    color: Color
    dir: Direction;
    size: 50;
};
export class Card extends Container {
    public readonly image: Sprite;
    public readonly graphics: Graphics
    constructor(options: CardOptions) {
        super();
        this.graphics = new Graphics();
        this.graphics.beginFill(0xFFFFFF);
        // set the line style to have a width of 5 and set the color to red
        this.graphics.lineStyle(5, 0xFF0000);
        // draw a card
        this.graphics.drawRoundedRect(
            0, 0, options.size, options.size * 1.4, 10
        );
        this.addChild(this.graphics);
    }
}
