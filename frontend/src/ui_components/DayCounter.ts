import { Sprite, Text, TextStyle, ObservablePoint } from "pixi.js";
import { RoundedTriangle } from "./RoundedTriangle";
import { FancyButton } from "@pixi/ui";

export class DayCounter extends FancyButton {

    private days: Array<RoundedTriangle>;
    private label: Text;
    public day: number;

    constructor() {
        super();

        this.day = 0;
        //console.log(this.day);

        this.days = new Array<RoundedTriangle>;
        for (let i = 0; i < 6; i++) {
            this.days[i] = new RoundedTriangle();
            this.days[i].rotateTriangleDeg(30 + i * 60);
            this.days[i].x = Math.cos((60 - 60 * i) * Math.PI / 180) * 80;
            this.days[i].y = Math.sin((60 - 60 * i) * Math.PI / 180) * -80;
            this.addChild(this.days[i]);
        }
        this.label = new Text("Day Tracker", new TextStyle({
            fontFamily: "Concert One",
            fontSize: 40,
            fill: "#000000",
            align: "left",
        }));
        this.label.x = -100;
        this.label.y = -190;
        this.addChild(this.label);
    }
    
    public cycleDay(counter: DayCounter) {
        if (counter.day == 6) {
            counter.days.forEach(ele => {
                ele.turnOff();
            });
            counter.day = 0;
        } else {
            counter.days[counter.day++].turnOn();
        }
    }

    public resize(width: number) {
        let tmpW = this.width;
        let tmpH = this.height;
        this.width = width * 0.8;
        this.height = this.width * tmpH / tmpW;
    }
}