import { Button, FancyButton } from '@pixi/ui';
import { Container, Graphics } from 'pixi.js';

const origWidth = 800;
const origHeight = 500;

export class MenuContainer extends Container {

    private menuContainer: FancyButton;

    constructor() {
        super();

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
        this.menuContainer.scale.x = 1;
        this.menuContainer.scale.y = 1;
    }
}