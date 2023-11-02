import { TextStyle, Text, Graphics } from "pixi.js";
import { FancyButton, Button } from "@pixi/ui";

export class BackButton extends FancyButton {

    private backButton: FancyButton;
    private percentX: number;
    private percentY: number;
    public label: Text;

    constructor(x: number, y: number, parentW: number, parentH: number) {
        super();

        this.percentX = x;
        this.percentY = y;

        this.label = new Text("X", new TextStyle({
            fontFamily: "Concert One",
            fontSize: 40,
            fill: "#000000",
            align: "center",
        }));

        this.backButton = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xff0000, 0.6)
                        .drawCircle(30, 30, 30)
            )).view,
            text: this.label,
            padding: 0,
            anchor: 0.5,
        });

        this.addChild(this.backButton);
    }

    public resize(bounds: Array<number>) {
        // Top, bottom, left, right
        this.x = bounds[2] + (bounds[3] - bounds[2]) * this.percentX;
        this.y = bounds[0] + (bounds[1] - bounds[0]) * this.percentY;
    }
}