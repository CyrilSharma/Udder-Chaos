import { Container, Sprite } from 'pixi.js';
import { Direction, Color } from './Utils';

export type CardOptions = {
    color: Color
    playerMove: Direction;
    enemyMove:  Direction;
    size: 50;
};
export class Card extends Container {
    public readonly image: Sprite;
    constructor(options: CardOptions) {
        super();
        this.image = new Sprite();
        this.image.anchor.set(0.5);
        this.addChild(this.image);

        this.visible = true;
        this.alpha = 1;
        this.image.alpha = 1;
        this.scale.set(1);
        this.image.texture = Texture.from(opts.name);
    }
}
