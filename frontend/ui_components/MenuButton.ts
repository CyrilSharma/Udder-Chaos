import { Button, FancyButton } from '@pixi/ui';
import { Container, Graphics } from 'pixi.js';

export class MenuButton extends Container {

    private button: FancyButton;
    private posx: number;
    private posy: number;
    private AR: number;
    private size: number;

    constructor(text: string, posx: number, posy: number, color: number, AR: number, size: number, bevel: number) {
        super();
        
        this.posx = posx;
        this.posy = posy;
        this.size = size;
        this.AR = AR;

        this.button = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(color)
                        .drawRoundedRect(0, 0, AR * 100, 100, bevel)
            )).view,
            pressedView: (new Button(
                new Graphics()
                        .beginFill(color + 0x001a4d)
                        .drawRoundedRect(0, 0, AR * 100, 100, bevel)
            )).view,
            anchor: 0.5,
            text: text
        });

    }

    public getButton() {
        return this.button;
    }

    public resize(width: number, height: number) {
        
        // width and height are parent dims
        this.button.view.width = height * this.size * this.AR;
        this.button.view.height = height * this.size;

        // Stop overlap for multi buttons
        if (this.button.view.width > width * this.size * 2) {
            this.button.view.width = width * this.size * 2;
            this.button.view.height = this.button.view.width / this.AR;
        }

        this.button.view.x = width * this.posx;
        this.button.view.y = height * this.posy;
    }

}