import { Sprite, Graphics, ObservablePoint } from "pixi.js";
import { FancyButton, Button } from "@pixi/ui";



export class PlayerColorIcon extends Sprite {

    private borderButton: FancyButton;
    private ufo: Sprite;

    constructor(color: number) {
        super()
        this.borderButton = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                    .beginFill(0xffffff)
                    .lineStyle(5, color, 1, 0)
                    .drawCircle(50, 50, 50)
            )).view,
            anchor: 0.5
        });
        this.addChild(this.borderButton);

        switch(color) {
            case 0:
                this.ufo = Sprite.from('../../images/raw-player_red.png');
                break;
            case 2:
                this.ufo = Sprite.from('../../images/raw-player_blue.png');
                break;
            case 3:
                this.ufo = Sprite.from('../../images/raw-player_purple.png');
                break;
            case 1:
                this.ufo = Sprite.from('../../images/raw-player_yellow.png');
                break;
            default:
                this.ufo = Sprite.from('../../images/raw-player_red.png');
                break;
        }
        this.ufo.anchor = new ObservablePoint(() => {}, null, 0.5, 0.5);
        this.ufo.scale.x = 0.2;
        this.ufo.scale.y = 0.2;
        this.addChild(this.ufo);

    }

    public changeColor(color: number) {

        //this.removeChild(this.ufo);
        switch(color) {
            case 0:
                //this.ufo = Sprite.from('../../raw-assets/player_red.png');
                this.borderButton.defaultView = new Graphics()
                    .beginFill(0xffffff)
                    .lineStyle(5, 0xff0000, 1, 0)
                    .drawCircle(50, 50, 50)
                break;
            case 2:
                //this.ufo = Sprite.from('../../raw-assets/player_blue.png');
                this.borderButton.defaultView = new Graphics()
                    .beginFill(0xffffff)
                    .lineStyle(5, 0x0085ff, 1, 0)
                    .drawCircle(50, 50, 50)
                break;
            case 3:
                //this.ufo = Sprite.from('../../raw-assets/player_purple.png');
                this.borderButton.defaultView = new Graphics()
                    .beginFill(0xffffff)
                    .lineStyle(5, 0xad00ff, 1, 0)
                    .drawCircle(50, 50, 50)
                break;
            case 1:
                //this.ufo = Sprite.from('../../raw-assets/player_yellow.png');
                this.borderButton.defaultView = new Graphics()
                    .beginFill(0xffffff)
                    .lineStyle(5, 0xffab2e, 1, 0)
                    .drawCircle(50, 50, 50)
                break;
            default:
                //this.ufo = Sprite.from('../../raw-assets/player_red.png');
                break;
        }
        this.y = 300;
        //this.addChild(this.ufo);
    }

}