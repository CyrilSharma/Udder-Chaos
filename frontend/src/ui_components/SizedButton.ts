import { Button, FancyButton } from '@pixi/ui';
import { Container, Graphics, TextStyleAlign } from 'pixi.js';
import { Text, TextStyle } from 'pixi.js';

export class SizedButton extends FancyButton {

    private button: FancyButton;
    private percentX: number;
    private percentY: number;
    private percentWidth: number;
    private percentHeight: number;
    public label: Text;

    constructor(x: number, y: number, width: number, height: number, text: string, parentW: number, parentH: number, fontSize: number, color: number) {
        super();
        
        this.label = new Text(text, new TextStyle({
            fontFamily: "Concert One",
            fontSize: fontSize,
            fill: "#000000",
            align: "center",
        }));
        this.percentWidth = width;
        this.percentHeight = height;
        this.percentX = x;
        this.percentY = y;

        this.button = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(color)
                        .drawRoundedRect(0, 0, width * parentW, height * parentH, 0.025 * (parentW + parentH))
            )).view,
            anchor: 0.5,
            text: this.label
        });

        this.addChild(this.button);
    }

    public changeText(str: string) {
        this.label.text = str;
    }

    public resize(bounds: Array<number>) {
        // Top, bottom, left, right
        this.x = bounds[2] + (bounds[3] - bounds[2]) * this.percentX;
        this.y = bounds[0] + (bounds[1] - bounds[0]) * this.percentY;
        this.width = (bounds[3] - bounds[2]) * this.percentWidth;
        this.height = (bounds[1] - bounds[0]) * this.percentHeight;
    }

}