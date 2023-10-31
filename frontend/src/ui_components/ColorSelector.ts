import { FancyButton, Button } from "@pixi/ui";
import { Graphics, Text, TextStyle } from "pixi.js";

const playerColors = [0xff0000, 0x0085ff, 0xad00ff, 0xffab2e, 0x9f9f9f];

export class ColorSelector extends FancyButton {

    private selectorButton: FancyButton;
    private color: number;
    private icons: Array<Graphics>;
    private question: Text;

    constructor() {
        super();

        this.question = new Text("?", new TextStyle({
            fontFamily: "Concert One",
            fontSize: 40,
            fill: "#000000",
            align: "center",
        }));

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
            text: this.question
        });
        this.addChild(this.selectorButton);
    }

    public reset() : number {
        let tmp = this.color;
        this.color = 4;
        return tmp;
    }

    public setColor(color: number) {
        this.color = color;
    }

    public swapColor(available: Array<boolean>) : number {
        let temp = this.color;
        do {
            temp++;
            temp %= 5;
            if (available[temp]) {
                this.selectorButton.defaultView = this.icons[temp];
                if (temp == 4) {
                    this.selectorButton.text = this.question;
                } else {
                    this.selectorButton.text = "";
                }
                available[this.color] = true;
                if (temp != 4) {
                    available[temp] = false;
                }
                this.color = temp;
                return this.color;
            }
        } while (!available[temp]);
        return -1;
    }
}