import { Button, FancyButton } from '@pixi/ui';
import { Container, Graphics } from 'pixi.js';

const origWidth = 800;
const origHeight = 500;

export class MenuContainer extends Container {

    private menuContainer: FancyButton;
    private wide: number;
    private high: number;

    constructor() {
        super();

        this.wide = 800;
        this.high = 500;

        this.menuContainer = new FancyButton({
            defaultView: (new Button(
               new Graphics()
                   .beginFill(0xffcc66, 0.5)
                   .drawRoundedRect(0, 0, 800, 500, 60)
            )).view,
            anchor: 0.5,
        });
        this.addChild(this.menuContainer);
    }

    public getBox() {
        return [this.menuContainer.getBounds().top,
                this.menuContainer.getBounds().bottom,
                this.menuContainer.getBounds().left,
                this.menuContainer.getBounds().right];
    }

    public resize(width: number, height: number) {
        this.menuContainer.view.x = width * 0.5;
        this.menuContainer.view.y = height * 0.5;

        if (this.width > width * 0.9 && this.height < height * 0.9) {
            this.menuContainer.width = 0.9 * width;
            this.menuContainer.height = 0.9 * width * 5 / 8;
        } else if (this.height > height * 0.9 && this.width < width * 0.9) {
            this.menuContainer.height = 0.9 * height;
            this.menuContainer.width = 0.9 * height * 8 / 5;
        } else if (width / height > this.wide / this.high) {
            this.menuContainer.height = 0.9 * height;
            this.menuContainer.width = 0.9 * height * 8 / 5;
        } else {
            this.menuContainer.width = 0.9 * width;
            this.menuContainer.height = 0.9 * width * 5 / 8;
        }
    }
}