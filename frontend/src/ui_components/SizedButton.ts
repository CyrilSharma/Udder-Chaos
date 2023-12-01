import { Button, FancyButton } from '@pixi/ui';
import { Container, Graphics, TextStyleAlign } from 'pixi.js';
import { Text, TextStyle } from 'pixi.js';

export class SizedButton extends FancyButton {

    private button: FancyButton;
    private percentX: number;
    private percentY: number;
    private percentWidth: number;
    private percentHeight: number;
    private myWidth: number;
    private parentW: number;
    private myHeight: number;
    private parentH: number;
    private fontSize: number;
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

        this.myWidth = width;
        this.myHeight = height;
        this.parentW = parentW;
        this.parentH = parentH;
        this.fontSize = fontSize;

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

    public setX(x: number, bounds: Array<number>) {
        this.percentX = x;
        this.resize(bounds);
    }

    public setY(y: number, bounds: Array<number>) {
        this.percentY = y;
        this.resize(bounds);
    }

    public changeText(str: string) {
        this.label.text = str;
    }

    public getText() : string {
        return this.label.text;
    }

    public resize(bounds: Array<number>) {
        // Top, bottom, left, right
        this.x = bounds[2] + (bounds[3] - bounds[2]) * this.percentX;
        this.y = bounds[0] + (bounds[1] - bounds[0]) * this.percentY;
        this.width = (bounds[3] - bounds[2]) * this.percentWidth;
        this.height = (bounds[1] - bounds[0]) * this.percentHeight;

        console.log(bounds);
    }

    public setColor(color: number) {
        // console.log("setcolor");
        this.removeChild(this.button);

        this.label = new Text(this.text, new TextStyle({
            fontFamily: "Concert One",
            fontSize: this.fontSize,
            fill: "#000000",
            align: "center",
        }));

        this.button = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(color)
                        .drawRoundedRect(0, 0, this.myWidth * this.parentW, this.myHeight * this.parentH, 0.025 * (this.parentW + this.parentH))
            )).view,
            anchor: 0.5,
            text: this.label,
        });
        
        // this.resize([this.y, this.y + this.myHeight * this.parentH, this.x, this.x + this.myWidth * this.parentW,]);

        this.addChild(this.button);

    }

}