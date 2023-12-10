import { Sprite, Text, TextStyle, ObservablePoint } from "pixi.js";
import { RoundedTriangle } from "./RoundedTriangle";
import { FancyButton } from "@pixi/ui";

export class DayCounter extends FancyButton {

    private days: Array<RoundedTriangle>;
    private label: Text;
    public totDays: number;
    public day: number;
    public cow: Sprite;
    public target: Text;


    constructor(days: number, cow_sacrifice: number) {
        super();

        this.day = 0;
        this.totDays = days;
        this.cow = Sprite.from("images/cow.png");
        this.cow.anchor = new ObservablePoint(() => {}, null, 0.5, 0.5);
        this.cow.x = 90;
        this.cow.y = 150;
        this.cow.scale.x = 1.0;
        this.cow.scale.y = 1.0;
        this.addChild(this.cow);

        this.target = new Text(cow_sacrifice, new TextStyle({
            fontFamily: "Concert One",
            fontSize: 100,
            fill: "#000000",
            align: "center",
        }));
        this.target.x = -90;
        this.target.y = 150;
        this.addChild(this.target);
        //console.log(this.day);

        this.days = new Array<RoundedTriangle>;
        for (let i = 0; i < days - 1; i++) {
            this.days[i] = new RoundedTriangle(days - 1);
            this.days[i].rotateTriangleDeg((180 / (days - 1)) + i * 360 / (days - 1));
            this.days[i].x = Math.cos(((360 / (days - 1)) - (360 / (days - 1)) * (i)) * Math.PI / 180) * 100;
            this.days[i].y = Math.sin((-(360 / (days - 1)) + (360 / (days - 1)) * (i)) * Math.PI / 180) * 100;
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