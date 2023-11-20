import { LINE_JOIN, Graphics, Sprite, ObservablePoint } from "pixi.js";
import { FancyButton } from "@pixi/ui";

const offsets = [[0, 0],
                 [1, 1],
                 [2, 2],
                 [0.2, 1],
                 [0.131, 0.4],
                 [0.26, 0.26],
                 [0.42, 0.288],
                 [0.61, 0.298],
                 [0.775, 0.34],
                 [0.915, 0.38],
                 [1.08, 0.5],
                 [1.22, 0.55],
                 [1.35, 0.62],
                 [1.44, 0.7],
                 [1.535, 0.78],
                 [1.62, 0.855],
                 [1.8, 0.91],
                 [1.87, 0.96],
                 [1.935, 1.03],
                 [2, 1.1]];

export class RoundedTriangle extends Sprite {

    public triangleOff: FancyButton;
    private triangleOn: FancyButton;
    private alph: number;
    private beta: number;
    private A: number;
    //public rectangle: FancyButton;
    public size: number;

    constructor(fraction: number) {
        super();

        this.size = 100;//6 / fraction * 100;
        this.alph = Math.PI * 2 / fraction;
        this.beta = (Math.PI / 2) - this.alph / 2;
        this.A = 2 * this.size * Math.sin(this.alph / 2) / Math.sin(this.beta);

        // this.rectangle = new FancyButton({
        //     defaultView: new Graphics()
        //         .lineStyle({join: LINE_JOIN.ROUND, width: 2, color: 0xffeb00})
        //         .beginFill(0xff0000, 0)
        //         .drawRoundedRect(0, 0, this.A, this.size, 1),
        //     anchorX: 0.5,
        //     anchorY: 0
        // });
        //this.rectangle.pivot = new ObservablePoint(() => {}, null, this.width * 0.5, this.height * 0.5);
        //this.addChild(this.rectangle);

        this.triangleOff = new FancyButton({
            defaultView: new Graphics()
                .lineStyle({join: LINE_JOIN.ROUND, width: 20, color: 0xbfd4d9, alignment: 0.5})
                .beginFill(0xbfd4d9)
                .drawPolygon(0, 0, this.A, 0, this.A / 2, this.size),
            anchorX: offsets[fraction][0],
            anchorY: offsets[fraction][1]
        });
        this.addChild(this.triangleOff);

        this.triangleOn = new FancyButton({
            defaultView: new Graphics()
                .lineStyle({join: LINE_JOIN.ROUND, width: 20, color: 0xffeb00})
                .beginFill(0xffeb00)
                .drawPolygon(0, 0, this.A, 0, this.A / 2, this.size),
            anchorX: offsets[fraction][0],
            anchorY: offsets[fraction][1]
        });
        //this.triangleOn.pivot = new ObservablePoint(() => {}, null, 0.5, 0.288675);
        this.triangleOn.visible = false;
        this.addChild(this.triangleOn);
    
    }

    public rotateTriangleDeg(degrees: number) {
        this.triangleOff.angle = degrees;
        this.triangleOn.angle = degrees;
        //this.rectangle.angle = degrees;
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

