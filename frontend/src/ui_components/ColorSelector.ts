import { FancyButton, Button } from "@pixi/ui";
import { Graphics, Text, TextStyle } from "pixi.js";

const playerColorNames = {RED: 0, BLUE: 1, PURPLE: 2, ORANGE: 3, NONE: 4};
const playerColors = [0xff0000, 0x0085ff, 0xad00ff, 0xffab2e, 0x9f9f9f];
const question = new Text("?", new TextStyle({
    fontFamily: "Concert One",
    fontSize: 40,
    fill: "#000000",
    align: "center",
}));

export class ColorSelector extends FancyButton {

    private selectorButton: FancyButton;
    private color: number;
    private icons: Array<Graphics>;
    private available: Array<boolean>;

    constructor() {
        super();

        this.available = [true, true, true, true, true];

        this.color = 4;
        this.icons = new Array<Graphics>;
        for (let i = 0; i < 5; i++) {
            this.icons[i] = new Graphics()
                .beginFill(playerColors[i])
                .drawCircle(30, 30, 30);
        }

        this.selectorButton = new FancyButton({
            defaultView: this.icons[this.color],
            anchor: 0.5,
            text: ""
        });
        this.selectorButton.onPress.connect(() => {this.swapColor()});
        this.addChild(this.selectorButton);

    }

    public swapColor() {
        let temp = this.color;
        do {
            temp++;
            temp %= 5;
            if (this.available[temp]) {
                this.selectorButton.defaultView = this.icons[temp];
                if (temp == 4) {
                    this.selectorButton.text = question;
                } else {
                    this.selectorButton.text = "";
                }
                this.available[this.color] = true;
                if (temp != 4) {
                    this.available[temp] = false;
                }
                this.color = temp;
                break;
            }
        } while (!this.available[temp]);
    }

    









}