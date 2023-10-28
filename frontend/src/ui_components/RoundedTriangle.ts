import { LINE_JOIN, Graphics, Sprite, ObservablePoint } from "pixi.js";
import { FancyButton } from "@pixi/ui";

export class RoundedTriangle extends Sprite {

    private triangleOff: FancyButton;
    private triangleOn: FancyButton;

    constructor() {
        super();

        this.triangleOff = new FancyButton({
            defaultView: new Graphics()
                .lineStyle({join: LINE_JOIN.ROUND, width: 20, color: 0xbfd4d9, alignment: 0.5})
                .beginFill(0xbfd4d9)
                .drawPolygon(0,0, 100,0, 50,86.6),
            anchorX: 0.42, 
            anchorY: 0.288675
        });
        this.addChild(this.triangleOff);

        this.triangleOn = new FancyButton({
            defaultView: new Graphics()
                .lineStyle({join: LINE_JOIN.ROUND, width: 20, color: 0xffeb00})
                .beginFill(0xffeb00)
                .drawPolygon(0,0, 100,0, 50,86.6),
            anchorX: 0.42,
            anchorY: 0.288675
        });
        this.triangleOn.pivot = new ObservablePoint(() => {}, null, 0.5, 0.288675);
        this.triangleOn.visible = false;
        this.addChild(this.triangleOn);
    }

    public rotateTriangleDeg(degrees: number) {
        this.triangleOff.angle = degrees;
        this.triangleOn.angle = degrees;
    }

    public getState() : boolean {
        return this.triangleOn.visible;
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

