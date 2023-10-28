import { LINE_JOIN, Graphics, Sprite } from "pixi.js";
import { FancyButton } from "@pixi/ui";

export class RoundedTriangle extends Sprite {

    private triangleOff: FancyButton;
    private triangleOn: FancyButton;

    constructor() {
        super();

        this.triangleOff = new FancyButton({
            defaultView: new Graphics()
                .lineStyle({join: LINE_JOIN.ROUND, width: 50, color: 0xbfd4d9})
                .beginFill()
                .drawPolygon(0,0, 100,0, 50,86.6),
            anchor: 0.5
        });
        this.addChild(this.triangleOff);

        this.triangleOn = new FancyButton({
            defaultView: new Graphics()
                .lineStyle({join: LINE_JOIN.ROUND, width: 50, color: 0xffeb00})
                .beginFill()
                .drawPolygon(0,0, 100,0, 50,86.6),
            anchor: 0.5
        });
    
        this.addChild(this.triangleOn);
    }

    public turnOn() {
        this.triangleOff.visible = false;
        this.triangleOn.visible = true;
    }

    public turnOff() {
        this.triangleOff.visible = true;
        this.triangleOn.visible = false;
    }

}

