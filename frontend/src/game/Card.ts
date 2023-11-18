import { Container, FederatedPointerEvent, Graphics, Sprite, Point } from 'pixi.js';
import "@pixi/math-extras";
import { Direction, Color, DirectionEnum, angleBetween, mod, MoveType } from './Utils';
import { CardQueue } from './CardQueue';
import server from "../server";

const ALLOWED_POS_OFFSET = 5;
const ALLOWED_TIME_OFFSET = 800;

export type CardOptions = {
    color: Color
    dirs: Direction[];
    size: number;
    rotation: number;
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
        this.drawArrows(this.graphics, options);
        
        this.center = new Point(options.size/2, options.size/2);
        this.graphics.pivot = this.center;
                
        this.addChild(this.graphics);
        this.rotateCard(options.rotation);

        this.graphics.eventMode = 'static';
        this.graphics.on('pointerenter', this.onPointerEnter);
        this.graphics.on('pointerleave', this.onPointerLeave);
        this.graphics.on('pointerdown', this.onDragStart);
        this.graphics.on('pointerup', this.onDragEnd);
        this.graphics.on('pointerupoutside', this.onDragEnd);

    }

    /** Draw the appropriate arrows for each direction on the card */
    private drawArrows(g: Graphics, options: CardOptions) {
        let areaSum = 0;
        options.dirs.forEach((dir) => {
            areaSum += dir;
        });

        let maxSpace = options.size * 0.8;
        let arrowSize = maxSpace / 3;
        let lastX = ((options.size - maxSpace) / 2) + (areaSum * arrowSize * 0.5);
        let lastY = (options.size * 0.5) + (areaSum * arrowSize * 0.5);
        for(let i = 0; i < options.dirs.length; i++) {
            this.drawArrow(g, lastX, lastY, arrowSize * 0.5, arrowSize, options.dirs[i]);
            if (options.dirs[i] == 0) {
                lastX += (arrowSize)
            } else if (options.dirs[i] == 1) {
                lastY -= arrowSize
            }
        }
    }

    /** Creates an arrow, root at x, y, with width and height. */
    private drawArrow = (g: Graphics, x: number, y: number,
        width: number, height: number, dir: Direction) => {
            g.lineStyle(0, 0x000000);
            g.beginFill(0x000000);
        switch (dir) {
            // Systematically drawing arrows for cards for now, possibly sprites to come later.
            case DirectionEnum.UP: {
                g.drawRect(x - (width * 0.15), y - (height * 0.5), width * 0.3, height * 0.45);
                g.drawPolygon(
                    x - (width * 0.5), y - (height * 0.5),
                    x, y - (height * 0.9),
                    x + (width * 0.5), y - (height * 0.5)
                );
                break;
            }
            case DirectionEnum.RIGHT: {
                g.drawRect(x + (height * 0.05), y - (width * 0.15), height * 0.45, width * 0.3);
                g.drawPolygon(
                    x + (height * 0.5), y - (width * 0.5),
                    x + (height * 0.9), y,
                    x + (height * 0.5), y + (width * 0.5)
                );
                break;
            }
        }
    }    

    /** Card behavior when clicked (when played) */
    private async tapCard() {
        // Make sure it is out turn
        if (this.queue.game.ourTurn() && this.queue.checkCardInHand(this, this.queue.game.playerColor)) {

            // Play card both locally and on the server
            this.unscale();
            // Server play card must come before queue play card because queue playcard reindexes it :D
            server.playCard(this.index, this.queue.game.playerColor);
            this.queue.game.moveQueue.enqueue({"moveType": MoveType.PlayCard, "moveData": {"index": this.index}, "color": this.queue.game.playerColor, "animated": true})
        } else {
            console.log("Not your turn!!");
        }
    }

    private onPointerEnter = (e: FederatedPointerEvent) => {
        this.queue.bringCardToTop(this);
        this.upscale();
    };

    private onPointerLeave = (e: FederatedPointerEvent) => {
        this.unscale();
        this.queue.placeCards();
        this.onDragEnd(e);
    };

    private onDragStart = (e: FederatedPointerEvent) => {
        if (this.queue.game.ourTurn() && this.queue.checkCardInHand(this, this.queue.game.playerColor)) {

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

    private onDragEnd = async (e: FederatedPointerEvent) => {
        if (this.dragStartPos != null) {

            this.graphics.off('pointermove', this.onDragMove);
            this.dragStartPos = null;
            let trueAngle = mod(this.graphics.angle, 360);

            if (this.cardRotation * 90 - ALLOWED_POS_OFFSET <= trueAngle && trueAngle <= this.cardRotation * 90 + ALLOWED_POS_OFFSET) {
                let endTime = Date.now();
                if (endTime - this.dragStartTime < ALLOWED_TIME_OFFSET) {
                    await this.tapCard();
                }
                return;
            }

            let rotation = Math.floor((trueAngle + 45) / 90);

            server.rotateCard(this.index, rotation, this.queue.game.playerColor);
            this.queue.game.moveQueue.enqueue({"moveType": MoveType.RotateCard, "moveData": {"index": this.index, "rotation": rotation}, "color": this.queue.game.playerColor, "animated": true});
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
