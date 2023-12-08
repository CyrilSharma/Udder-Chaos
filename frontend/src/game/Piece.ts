import { Container, Sprite, Texture, Text, Graphics } from 'pixi.js';
import { TeamEnum, getTeam, Position } from './Utils'
import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";

// register the plugin
gsap.registerPlugin(PixiPlugin);

// give the plugin a reference to the PIXI object
PixiPlugin.registerPIXI(PIXI);

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
    public scoreDisplay: Container;
    public scoreText: Text;

    constructor() {
        super();
        this.image = Sprite.from("images/cow.png"); // temp assign image to something
        this.image.x = 500;
        this.image.y = 500;
        this.image.anchor.set(0.5, 0.5);
        this.addChild(this.image);
        
        this.scoreDisplay = new Container();

        let circle = new Graphics();
        this.scoreDisplay.addChild(circle);

        this.scoreText = new Text(this.score);
        this.scoreDisplay.addChild(this.scoreText);
        
        circle.beginFill(0xFFFFFF)
            .drawCircle(
                this.scoreText.width / 2,
                this.scoreText.height / 2,
                12
            );

        this.scoreDisplay.scale.set(5);
        this.scoreDisplay.x = 500;
        this.scoreDisplay.y = 500;

        this.scoreDisplay.visible = false;
        this.addChild(this.scoreDisplay);
        this.image.eventMode = 'static';
        this.image.on('mouseenter', () => {
            if (getTeam(this.type) != TeamEnum.Player) return;
            this.scoreText.text = this.score;
            this.scoreDisplay.visible = true;
        });
        this.image.on('mouseleave', (event) => {
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

    public async animateMove(newX: number, newY: number, animated: boolean) {
        if (animated) {
            await gsap.to(this, {
                pixi: { x: newX, y: newY },
                duration: 0.5,
                ease: "power.out"
            });
            // If the animation gets cancelled, auto-update piece location.
            this.x = newX;
            this.y = newY;
        } else {
            this.x = newX;
            this.y = newY;
        }
    }

    public async animateBounce(newX: number, newY: number, animated: boolean) {
        if (animated) {
            let oldX = this.x;
            let oldY = this.y;
            gsap.to(this, {
                pixi: { x: newX, y: newY },
                duration: 0.1,
                ease: "power1.in"
            });
            gsap.to(this, {
                pixi: { x: oldX, y: oldY },
                duration: 0.4,
                delay: 0.1,
                ease: "back.out"
            });
        }
    }

    public async animateAbducted(tileSize: number, animated: boolean) {
        if (animated) {
            let newY = this.y - (tileSize / 3);
            gsap.to(this, {
                pixi: { y: newY },
                duration: 0.3,
                ease: "linear"
            });
            await gsap.to(this.image, {
                pixi: { scale: 0, rotation: 360 },
                duration: 0.3,
                ease: "linear"
            });
        }
    }
    
    public async animateDestroy(animated: boolean) {
        if (animated) {
            await gsap.to(this.image, {
                pixi: { scale: 0},
                duration: 0.5,
                ease: "elastic.in"
            })
        }
    }

    public async addScore(amt: number = 1) {
        this.score += amt;
    }

    public removeScore() {
        let tempScore: number = this.score;
        this.score = 0;
        return tempScore;
    }
}
