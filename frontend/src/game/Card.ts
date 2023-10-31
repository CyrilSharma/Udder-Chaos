import { Container, FederatedPointerEvent, Graphics, Sprite, Point } from 'pixi.js';
import "@pixi/math-extras";
import { Direction, Color, DirectionEnum, angleBetween } from './Utils';
import { CardQueue } from './CardQueue';
import server from "../server";

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
    public dragStart: Point | null = null;
    public dirs: Direction[];
    public index: number;
    public scaled = false;
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
        //this.graphics.on('pointertap', this.onPointerTap);
        this.graphics.on('pointerenter', this.onPointerEnter);
        this.graphics.on('pointerleave', this.onPointerLeave);
        this.graphics.on('pointerdown', this.onDragStart);
        this.graphics.on('pointerup', this.onDragEnd);
        this.graphics.on('pointerupoutside', this.onDragEnd);
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
    private onPointerTap = (e: FederatedPointerEvent) => {
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
        this.position.x -= this.graphics.width / (2 * this.scale_on_focus);
        this.position.y -= this.graphics.height / 2;
        this.scale.set(this.scale_on_focus);
        this.scaled = true;
    };

    private onPointerLeave = (e: FederatedPointerEvent) => {
        this.unscale();
        this.queue.placeCards();
    };

    private onDragStart = (e: FederatedPointerEvent) => {
        this.dragStart = this.toLocal(e.global) as Point;
        console.log(`container: ${this.toLocal(e.global)}`);
        console.log(this.dragStart);

        console.log(`container size: ${this.center}`);
        this.graphics.on('pointermove', this.onDragMove);
    }

    private onDragMove = (e: FederatedPointerEvent) => {
        if (this.dragStart != null) {
            console.log();
            let currentPoint = this.toLocal(e.global) as Point;
            let angle = angleBetween(this.dragStart, currentPoint);
            this.graphics.rotation = angle;
        }
        //console.log(`end drag: ${e.offsetX} ${e.offsetY}`)
    }

    private onDragEnd = (e: FederatedPointerEvent) => {
        if (this.dragStart != null) {
            console.log(this.dragStart);
            console.log(this.center);
            console.log(this.toLocal(e.global));
            this.graphics.off('pointermove', this.onDragMove);
        }
        //console.log(`end drag: ${e.offsetX} ${e.offsetY}`)
    }

    private unscale = () => {
        if (!this.scaled) return;
        this.scale.set(1);
        this.position.x += this.graphics.width / (2 * this.scale_on_focus);
        this.position.y += this.graphics.height / 2;
        this.scaled = false;
    };

    public rotateCard(rotation: number) {
        console.log(this.dirs);
        for (let i = 0; i < this.dirs.length; i++) {
            this.dirs[i] = (this.dirs[i] + rotation) % 4
        }
        console.log(this.dirs);
        this.drawArrow(this.graphics, 10 / 2, 10 * 0.7, 10 / 3, 10 / 10, this.dirs[0]);
    }
}
