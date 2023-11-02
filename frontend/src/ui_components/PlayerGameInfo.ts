import { Container, ObservablePoint, Text, TextStyle, Graphics, Sprite, Color } from "pixi.js";
import { Button, FancyButton } from "@pixi/ui";


export class PlayerGameInfo extends Container {

    private displayArea: FancyButton;
    private playerName: Text;
    private ufo: Sprite;
    private units: Text;

    constructor(color: number) {
        super();

        this.displayArea = new FancyButton({
            defaultView: (new Button(
               new Graphics()
                   .beginFill(0xffffff)
                   .lineStyle(5, color, 1, 0)
                   .drawRoundedRect(0, 0, 400, 80, 15)
            )).view,
            anchor: 0.5
        });
        this.addChild(this.displayArea);

        this.playerName = new Text("Player name", new TextStyle({
            fontFamily: "Concert One",
            fontSize: 40,
            fill: "#000000",
            align: "left",
        }));
        this.playerName.anchor = new ObservablePoint(() => {}, null, 0.5, 0.5);
        this.playerName.x = -70;
        this.addChild(this.playerName);

        this.ufo = Sprite.from('../../raw-assets/hat_duck.gif');
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

    public changeText(text: string) {
        this.playerName.text = text;
    }

    public setUnits(units: number) {
        this.units.text = units;
    }

    public setColor(color: number) {
        switch(color) {
            case 0:
                this.displayArea.defaultView = new Graphics()
                    .beginFill(0xffffff)
                    .lineStyle(5, 0xff0000, 1, 0)
                    .drawRoundedRect(0, 0, 400, 80, 15)
                break;
            case 1:
                this.displayArea.defaultView = new Graphics()
                    .beginFill(0xffffff)
                    .lineStyle(5, 0x0085ff, 1, 0)
                    .drawRoundedRect(0, 0, 400, 80, 15)
                break;
            case 2:
                this.displayArea.defaultView = new Graphics()
                    .beginFill(0xffffff)
                    .lineStyle(5, 0xad00ff, 1, 0)
                    .drawRoundedRect(0, 0, 400, 80, 15)
                break;
            case 3:
                this.displayArea.defaultView = new Graphics()
                    .beginFill(0xffffff)
                    .lineStyle(5, 0xffab2e, 1, 0)
                    .drawRoundedRect(0, 0, 400, 80, 15)
                break;
            default:
                this.ufo = Sprite.from('../../raw-assets/player_red.png');
                break;
        }
    }

    public resize(width: number) {
        this.width = width;
        this.height = this.width * 0.2;

    }


}