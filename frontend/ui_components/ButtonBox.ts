import { Button, FancyButton } from '@pixi/ui';
import { Container, Graphics } from 'pixi.js';

export class ButtonBox extends Container {

    private buttonBox: FancyButton;
    private AR: number;
    private size: number;

    constructor(AR: number, size: number, bevel: number) {
        super();
        
        this.size = size;
        this.AR = AR;

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

    public getBox() {
        return this.buttonBox;
    }

    public resize(width: number, height: number) {
        this.buttonBox.view.x = width * 0.5;
        this.buttonBox.view.y = height * 0.5;
        this.buttonBox.view.width = this.AR * this.size * height;
        this.buttonBox.view.height = this.size * height;
    }

}