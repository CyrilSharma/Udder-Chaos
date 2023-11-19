import { Button, FancyButton } from '@pixi/ui';
import { Container, Graphics, TextStyleAlign } from 'pixi.js';
import { Text, TextStyle } from 'pixi.js';

export class NavButton extends FancyButton {

    private button: FancyButton;
    private percentX: number;
    private percentY: number;

    public label: Text;

    constructor(x: number, y: number, radius: number, text: string, parentW: number, parentH: number, fontSize: number, color: number) {
        super();
        
        this.radius = radius;
        this.label = new Text(text, new TextStyle({
            fontFamily: "Concert One",
            fontSize: fontSize,
            fill: "#000000",
            align: "center",
        }));
        this.percentX = x;
        this.percentY = y;

        this.button = new FancyButton({
            defaultView:
                new Graphics()
                    .beginFill(color) //0x5F00FF
                    .drawCircle(radius * parentW/2, radius * parentW/2, radius * parentW/2),
            pressedView:
                new Graphics()
                    .beginFill(color + 0x4A9900) //0xAA99FF
                    .drawCircle(radius * parentW/2, radius * parentW/2, radius * parentW/2),
            anchor: 1,
            text: this.label
        });
        this.addChild(this.button);
    }

    public resize(bounds: Array<number>) {
        // Top, bottom, left, right
        this.x = bounds[2] + (bounds[3] - bounds[2]) * this.percentX;
        this.y = bounds[0] + (bounds[1] - bounds[0]) * this.percentY;
        this.width = (bounds[3] - bounds[2]) * this.radius;
        this.height = this.width;
    }

}