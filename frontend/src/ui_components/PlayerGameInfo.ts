import { Container, ObservablePoint, Text, TextStyle, Graphics, Sprite, Color } from "pixi.js";
import { Button, FancyButton } from "@pixi/ui";
import * as PIXI from "pixi.js";
import { gsap } from "gsap";
import { PixiPlugin } from "gsap/PixiPlugin";

// register the plugin
gsap.registerPlugin(PixiPlugin);

// give the plugin a reference to the PIXI object
PixiPlugin.registerPIXI(PIXI);

export class PlayerGameInfo extends Container {

    public name: string = "Player name";
    private displayArea: FancyButton;
    private playerName: Text;
    private ufo: Sprite;
    private units: Text;
    private playerNameShad: Text;
    private color: number;
    private timer: FancyButton;

    constructor(color: number) {
        super();

        switch(color) {
            case 0:
                this.color = 0xff0000;
                break;
            case 2:
                this.color = 0x0085ff;
                break;
            case 3:
                this.color = 0xad00ff;
                break;
            case 1:
                this.color = 0xffab2e;
                break;
            default:
                this.color = 0x252525;
                break;
        }
        this.displayArea = new FancyButton({
            defaultView: (new Button(
               new Graphics()
                   .beginFill(0xffffff)
                   .lineStyle(5, this.color, 1, 0)
                   .drawRoundedRect(0, 0, 400, 80, 15)
            )).view,
            anchor: 0.5
        });
        this.addChild(this.displayArea);

        this.playerName = new Text(this.name, new TextStyle({
            fontFamily: "Concert One",
            fontSize: 40,
            fill: "#000000",
            align: "left",
        }));
        this.playerNameShad = new Text(this.name, new TextStyle({
            fontFamily: "Concert One",
            fontSize: 50,
            fill: "#000000",
            align: "center",
            dropShadow: true,
            dropShadowAlpha: 1,
            dropShadowBlur: 15,
            dropShadowColor: this.color
        }));

        this.timer = new FancyButton({
            defaultView: (new Button(
               new Graphics()
                   .beginFill(this.color, 0.4)
                   .drawRoundedRect(0, 0, 400, 80, 15)
            )).view,
            anchor: 0
        });

        this.playerName.anchor = new ObservablePoint(() => {}, null, 0.5, 0.5);
        this.playerName.x = -70;
        this.timer.x = this.displayArea.x - this.timer.width * 0.5;
        this.timer.y = this.displayArea.y - this.timer.height * 0.5;
        this.timer.visible = false;
        this.playerNameShad.anchor = new ObservablePoint(() => {}, null, 0.5, 0.5);
        this.playerNameShad.x = -60;
        this.addChild(this.playerName);
        this.addChild(this.playerNameShad);
        this.addChild(this.timer);
        this.playerNameShad.visible = false;

        if (color === -1) {
            this.ufo = Sprite.from('../../images/black_jet.png');
        } else {
            this.ufo = Sprite.from('../../images/black_ufo.png');
        }
        this.ufo.anchor = new ObservablePoint(() => {}, null, 0.5, 0.5);
        this.ufo.x = 150;
        this.ufo.scale.x = 0.25;
        this.ufo.scale.y = 0.25;
        this.addChild(this.ufo);

        this.units = new Text("4", new TextStyle({
            fontFamily: "Concert One",
            fontSize: 40,
            fill: "#000000",
            align: "left",
        }));
        this.units.anchor = new ObservablePoint(() => {}, null, 0.5, 0.5);
        this.units.x = 100;
        this.addChild(this.units);

        this.scale.x = 0.5;
        this.scale.y = 0.5;

    }

    public toggleTimer(state: boolean) {
        this.timer.visible = state;
    }

    public updateTimer(time: number, max_time: number) {
        if (time < 0) {
            time = 0;
        }
        const newWidth = this.displayArea.width * (time / max_time);

        // gsap.to(this.timer, {
        //     pixi: { width: newWidth },
        //     duration: 0.1,
        //     ease: "none"
        // });

        this.timer.width = newWidth;
    }

    public getUnits() : number {
        return Number(this.units.text);
    }

    public setUnits(units: number) {
        this.units.text = units;
    }

    public setColor(color: number) {
        switch(color) {
            case 0:
                this.color = 0xff0000;
                break;
            case 2:
                this.color = 0x0085ff;
                break;
            case 3:
                this.color = 0xad00ff;
                break;
            case 1:
                this.color = 0xffab2e;
                break;
            default:
                this.color = 0x252525;
                break;
        }
        this.displayArea = new FancyButton({
            defaultView: (new Button(
               new Graphics()
                   .beginFill(0xffffff)
                   .lineStyle(5, this.color, 1, 0)
                   .drawRoundedRect(0, 0, 400, 80, 15)
            )).view,
            anchor: 0.5
        });
        this.playerNameShad = new Text(this.name, new TextStyle({
            fontFamily: "Concert One",
            fontSize: 40,
            fill: "#000000",
            align: "left",
            dropShadow: true,
            dropShadowAlpha: 0.5,
            dropShadowBlur: 0.2,
            dropShadowColor: this.color
        }));
    }

    public setName(name: string) {
        this.name = name;
        this.playerName.text = name;
        this.playerNameShad.text = name;
    }

    public resize(width: number) {
        this.width = width;
        this.height = this.width * 0.2;
    }

    public addShadow() {
        this.playerName.visible = false;
        this.playerNameShad.visible = true;
    }
    
    public removeShadow() {
        this.playerName.visible = true;
        this.playerNameShad.visible = false;
    }
}