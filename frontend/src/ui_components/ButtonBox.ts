import { Button, FancyButton } from '@pixi/ui';
import { Container, Graphics } from 'pixi.js';

export class ButtonBox extends Container {

    private buttonBox: FancyButton;
    private AR: number;
    private size: number;
    private _x: number;

    constructor(AR: number, size: number, bevel: number) {
        super();
        this.size = size;
        this.AR = AR;
        this._x = 0;

        this.buttonBox = new FancyButton({
            defaultView: (new Button(
               new Graphics()
                   .beginFill(0xffcc66, 0.5)
                   .drawRoundedRect(0, 0, AR * 100, 100, bevel)
            )).view,
            anchor: 0.5,
        });
        this.addChild(this.buttonBox);
        
    }

    // public get x(): number {
    //     return this._x;
    // }
    // public set x(value: number) {
    //     this._x = value;
    // }

    // public getBox() {
    //     return this.buttonBox;
    // }

    // public resize(width: number, height: number) {

    //     this.buttonBox.x = width * 0.5;
    //     this.buttonBox.y = height * 0.5;
    //     this.x = this.buttonBox.x;

    //     if (width * 0.85 <= this.AR * this.size * height) {

    //         this.buttonBox.view.width = width * this.size;
    //         this.buttonBox.view.height = this.size * width / this.AR;

    //     } else {
    //         this.buttonBox.view.width = this.AR * this.size * height;
    //         this.buttonBox.view.height = this.size * height;
    //     }

    // }

}