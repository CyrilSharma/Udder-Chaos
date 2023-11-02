import { Container, FederatedPointerEvent, Graphics, Sprite, Point } from 'pixi.js';
import "@pixi/math-extras";
import { Direction, Color, DirectionEnum, angleBetween, mod } from './Utils';
import { CardQueue } from './CardQueue';
import server from "../server";

const ALLOWED_POS_OFFSET = 5;
const ALLOWED_TIME_OFFSET = 800;

export type CardOptions = {
    color: Color
    dirs: Direction[];
    size: number;
};

export class Card extends Container {
    public readonly queue: CardQueue;
    public readonly graphics: Graphics;
    public readonly scale_on_focus = 1.5;
    public center: Point;
    public dragStartPos: Point | null = null;
    public dragStartTime: number = -1;
    public dirs: Direction[];
    public index: number;
    public scaled = false;
    public cardRotation: number = 0;
    constructor(queue: CardQueue, options: CardOptions, index: number) {
        super();
        this.queue = queue;
        this.index = index;
        this.graphics = new Graphics();
        this.graphics.beginFill(0xFFFFFF);
        this.dirs = options.dirs;
        // set the line style to have a width of 5 and set the color to black
        this.graphics.lineStyle(5, 0x000000);
        // draw a card
        this.graphics.drawRoundedRect(
            0, 0, options.size, options.size, 10
        );
        this.drawArrow(this.graphics, options.size / 2, options.size / 2, options.size / 3, options.size / 10, options.dirs[0]); // TEMP draw just the first arrow, maybe some visual indication later
        
        this.center = new Point(options.size/2, options.size/2);
        this.graphics.pivot = this.center;
                
        this.addChild(this.graphics);
        this.graphics.eventMode = 'static';
        this.graphics.on('pointerenter', this.onPointerEnter);
        this.graphics.on('pointerleave', this.onPointerLeave);
        this.graphics.on('pointerdown', this.onDragStart);
        this.graphics.on('pointerup', this.onDragEnd);
        this.graphics.on('pointerupoutside', this.onDragEnd);
        //this.graphics.on('pointertap', this.onPointerTap);
    }

    private drawArrow = (g: Graphics, x: number, y: number,
        width: number, height: number, dir: Direction) => {
        switch (dir) {
            // Systematically drawing arrows for cards for now, possibly sprites to come later.
            case DirectionEnum.DOWN: {
                x -= height / 2; y -= width / 2;
                g.drawRect(x + height / 3, y, height / 3, 3 * width / 4);
                g.drawPolygon(
                    x, y + 3 * width / 4,
                    x + height / 2, y + width,
                    x + height, y + 3 * width / 4
                );
                break;
            }
            case DirectionEnum.UP: {
                x -= height / 2; y -= width / 2;
                g.drawRect(x + height / 3, y + width / 4, height / 3, 3 * width / 4);
                g.drawPolygon(
                    x, y + width / 4,
                    x + height / 2, y,
                    x + height, y + width / 4
                );
                break;
            }
            case DirectionEnum.LEFT: {
                x -= width / 2; y -= height / 2;
                g.drawRect(x + width / 4, y + height / 3, 3 * width / 4, height / 3);
                g.drawPolygon(
                    x + width / 4, y + 0,
                    x, y + height / 2,
                    x + width / 4, y + height
                );
                break;
            }
            case DirectionEnum.RIGHT: {
                x -= width / 2; y -= height / 2;
                g.drawRect(x, y + height / 3, 3 * width / 4, height / 3);
                g.drawPolygon(
                    x + 3 * width / 4, y + 0,
                    x + width, y + height / 2,
                    x + 3 * width / 4, y + height
                );
                break;
            }
        }
    }

    /** Card behavior when clicked (when played) */
    private tapCard() {
        console.log("tap!")
        // Make sure it is out turn
        if (this.queue.game.ourTurn()) {
            // Play card both locally and on the server
            this.unscale();
            // Server play card must come before queue play card because queue playcard reindexes it :D
            server.playCard(this.index, this.queue.game.playerColor);
            this.queue.playCard(this, this.queue.game.playerColor);
            this.queue.game.updateTurn();
        } else {
            console.log("Not your turn!!");
        }
    }

    private onPointerEnter = (e: FederatedPointerEvent) => {
        //console.log("Hover over card " + this.index);
        this.queue.bringCardToTop(this);
        this.upscale();
    };

    private onPointerLeave = (e: FederatedPointerEvent) => {
        this.unscale();
        this.queue.placeCards();
        this.onDragEnd(e);
        console.log("here")
    };

    private onDragStart = (e: FederatedPointerEvent) => {
        if (this.queue.game.ourTurn()) {
            this.dragStartPos = this.toLocal(e.global) as Point;
            this.graphics.on('pointermove', this.onDragMove);

            this.dragStartTime = Date.now();
        } else {
            console.log("Not your turn.")
        }
    }

    private onDragMove = (e: FederatedPointerEvent) => {
        if (this.dragStartPos != null) {
            let currentPoint = this.toLocal(e.global) as Point;
            let angle = angleBetween(this.dragStartPos, currentPoint);

            this.graphics.rotation = angle + (this.cardRotation * Math.PI / 2);
        }
        //console.log(`end drag: ${e.offsetX} ${e.offsetY}`)
    }

    private onDragEnd = (e: FederatedPointerEvent) => {
        if (this.dragStartPos != null) {
            console.log("end")
            this.graphics.off('pointermove', this.onDragMove);
            this.dragStartPos = null;
            let trueAngle = mod(this.graphics.angle, 360);

            if (this.cardRotation * 90 - ALLOWED_POS_OFFSET <= trueAngle && trueAngle <= this.cardRotation * 90 + ALLOWED_POS_OFFSET) {
                let endTime = Date.now();
                console.log("no ratation");
                if (endTime - this.dragStartTime < ALLOWED_TIME_OFFSET) {
                    this.tapCard();
                }
                return;
            }

            let rotation = Math.floor((trueAngle + 45) / 90);
            server.rotateCard(this.index, rotation, this.queue.game.playerColor);
            this.rotateCard(rotation - this.cardRotation);
            this.queue.game.updateTurn();
        }
        //console.log(`end drag: ${e.offsetX} ${e.offsetY}`)
    }

    private upscale = () => {
        if (this.scaled) return;
        this.scale.set(this.scale_on_focus);
        this.position.y -= (this.graphics.height * this.scale_on_focus - this.graphics.height) / 2;
        this.scaled = true;
    }

    private unscale = () => {
        if (!this.scaled) return;
        this.scale.set(1);
        this.position.y += (this.graphics.height * this.scale_on_focus - this.graphics.height) / 2;
        this.scaled = false;
    };

    public rotateCard(rotation: number) {
        for (let i = 0; i < this.dirs.length; i++) {
            this.dirs[i] = mod((this.dirs[i] - rotation), 4);
        }
        this.cardRotation = mod((this.cardRotation + rotation), 4);
        
        this.graphics.angle = this.cardRotation * 90;
    }
}
