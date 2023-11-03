import { Button, FancyButton } from '@pixi/ui';
import { Container, Graphics } from 'pixi.js';

export class GamePanel extends Container {

    public gamePanel: FancyButton;
    private wide: number;
    private high: number;
    private pX: number;
    private pY: number;
    private pW: number;
    private pH: number;

    constructor(pX: number, pY: number, pW: number, pH: number, wide: number, high: number, color: number) {
        super();

        this.pH = pH;
        this.pW = pW;
        this.pX = pX;
        this.pY = pY;
        this.wide = wide;
        this.high = high;

        this.gamePanel = new FancyButton({
            defaultView: (new Button(
               new Graphics()
                   .beginFill(color)
                   .drawRect(0, 0, wide, high)
            )).view,
            //text: "Hello World!",
            anchor: 0.5,
        });
        this.addChild(this.gamePanel);

    }

    public getBox() {
        return [this.gamePanel.getBounds().top,
                this.gamePanel.getBounds().bottom,
                this.gamePanel.getBounds().left,
                this.gamePanel.getBounds().right];
    }

    public resize(width: number, height: number) {
        this.x = width * this.pX;
        this.y = height * this.pY;

        if (this.width > width * this.pW && this.height < height * this.pH) {
            this.gamePanel.width = this.pW * width;
            this.gamePanel.height = this.pW * width * this.high / this.wide;
        } else if (this.height > height * this.pH && this.width < width * this.pW) {
            this.gamePanel.height = this.pH * height;
            this.gamePanel.width = this.pH * height * this.wide / this.high;
        } else if (width / height > this.wide / this.high) {
            this.gamePanel.height = this.pH * height;
            this.gamePanel.width = this.pH * height * this.wide / this.high;
        } else {
            this.gamePanel.width = this.pW * width;
            this.gamePanel.height = this.pW * width * this.high / this.wide;
        }

    }
}