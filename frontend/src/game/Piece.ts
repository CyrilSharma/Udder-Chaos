import { Container, Sprite, Texture } from 'pixi.js';

/** Default piece options */
const defaultPieceOptions = {
    /** Piece name, must match one of the textures available */
    name: '',
    /** Attributed piece type in the grid */
    type: 0,
    /** Piece size - width & height - in pixel */
    size: 50,
};

/** Piece configuration parameters */
export type PieceOptions = typeof defaultPieceOptions;

/**
 * The Piece class handles displaying and animating itself.
 */
export class Piece extends Container {
    private readonly image: Sprite;
    public row = 0;
    public column = 0;
    /** The piece type in the grid */
    public type = 0;
    /** The name of the piece - must match one of the available textures */
    public name = '';

    constructor() {
        super();
        this.image = Sprite.from("raw-assets/red_ufo.png");
        this.image.anchor.set(0.5);
        this.image.x = 500;
        this.image.y = 500;
        this.addChild(this.image);
    }

    public setup(options: Partial<PieceOptions> = {}) {
        console.log("I'm about to be on the screen.");
        const opts = { ...defaultPieceOptions, ...options };
        this.visible = true;
        this.alpha = 1;
        this.type = opts.type;
        this.name = opts.name;
        this.image.alpha = 1;
        this.scale.set(1);
        this.image.texture = Texture.from(opts.name);
        this.image.width = opts.size;
        this.image.height = this.image.width;
        console.log("I'm on the screen!");
    }

    /** Animation to come soon... */
    public async animateMove(x: number, y: number) {
        this.row = y;
        this.column = x;
    }
}