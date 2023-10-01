import { Container, Sprite, Graphics } from 'pixi.js';
import { FancyButton, Button } from '@pixi/ui';

/** Screen shows upon opening the website */
export class CreateGameScreen extends Container {

    private background: Sprite;
    private gameLobbyLabel: FancyButton;
    //private container: Container;

    constructor() {
        super();

        this.background = Sprite.from('./src/assets/mainBackground.jpg');

        this.gameLobbyLabel = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xffcc66)
                        .drawRoundedRect(0, 0, 300, 150, 60)
            )).view,
            pressedView:  (new Button(
                new Graphics()
                        .beginFill(0xffe6b3)
                        .drawRoundedRect(0, 0, 300, 150, 60)
            )).view,
            anchor: 0.5,
            text: "Join Game"
        });

        this.addChild(this.background);
        this.addChild(this.gameLobbyLabel);
    }

    public async show() {
    }

    public async hide() {
    }

    public resize(width: number, height: number) {
        this.background.x = 0;
        this.background.y = 0;
        this.background.width = width;
        this.background.height = height;
    }

}