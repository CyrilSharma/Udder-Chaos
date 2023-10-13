import { Container, Sprite, Texture, Text } from 'pixi.js';

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
    public readonly image: Sprite;
    public row: number = 0;
    public column: number = 0;
    /** The piece type in the grid - corresponds to Utils/PieceEnum */
    public type: number = 0;
    /** The name of the piece - must match one of the available textures */
    public name: string = '';
    public score: number = 0;
    public scoreDisplay: Text;

    constructor() {
        super();
        this.image = Sprite.from("raw-assets/cow.png"); // temp assign image to something
        this.image.anchor.set(0.5);
        this.image.x = 500;
        this.image.y = 500;
        this.addChild(this.image);
        
        this.scoreDisplay = new Text(this.score);
        this.scoreDisplay.scale.set(5);
        this.scoreDisplay.x = 500;
        this.scoreDisplay.y = 500;
        this.scoreDisplay.visible = false;
        this.addChild(this.scoreDisplay);
        this.image.eventMode = 'static';
        this.image.on('mouseover', () => {
            this.scoreDisplay.text = this.score;
            this.scoreDisplay.visible = true;
        });
        this.image.on('mouseout', () => {
            this.scoreDisplay.visible = false;
        });
    }

    public setup(options: Partial<PieceOptions> = {}) {
        // console.log("I'm about to be on the screen.");
        const opts = { ...defaultPieceOptions, ...options };
        this.visible = true;
        this.alpha = 1;
        this.type = opts.type;
        this.name = opts.name;
        this.image.alpha = 1;
        this.scale.set(0.2);
        this.image.texture = Texture.from(opts.name);
        // console.log("I'm on the screen!");
    }

    /** Animation to come soon... */
    public async animateMove(x: number, y: number) {
        this.row = y;
        this.column = x;
    }

    public async addScore(amt: number = 1) {
        this.score += amt;
    }
}
