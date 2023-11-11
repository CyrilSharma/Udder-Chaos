import { Sprite, Text, TextStyle, ObservablePoint } from "pixi.js";
import { RoundedTriangle } from "./RoundedTriangle";
import { FancyButton } from "@pixi/ui";

export class DayCounter extends FancyButton {

    private days: Array<RoundedTriangle>;
    private label: Text;
    public totDays: number;
    public day: number;


    constructor(days: number) {
        super();

        this.day = 0;
        this.totDays = days;
        //console.log(this.day);

        this.days = new Array<RoundedTriangle>;
        for (let i = 0; i < days - 1; i++) {
            this.days[i] = new RoundedTriangle(days - 1);
            this.days[i].rotateTriangleDeg((180 / (days - 1)) + i * 360 / (days - 1));
            this.days[i].x = Math.cos(((360 / (days - 1)) - (360 / (days - 1)) * (i)) * Math.PI / 180) * 100;
            this.days[i].y = Math.sin((-(360 / (days - 1)) + (360 / (days - 1)) * (i)) * Math.PI / 180) * 100;
            //this.days[i].x = 0//Math.
            //this.days[i].y = 0//- this.days[i].triangleOff.width * 0.5 * Math.cos(i * 2 * Math.PI / (days - 1)) - this.days[i].triangleOff.height * 0.5 * Math.cos(i * 2 * Math.PI / (days - 1));
            this.addChild(this.days[i]);
        }
        this.label = new Text("Day Tracker", new TextStyle({
            fontFamily: "Concert One",
            fontSize: 40,
            fill: "#000000",
            align: "left",
        }));
        this.label.x = -100;
        this.label.y = -250;
        this.addChild(this.label);
    }
    
    public cycleDay(counter: DayCounter) {
        if (counter.day == counter.totDays - 1) {
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