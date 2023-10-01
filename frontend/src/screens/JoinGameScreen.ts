import { Container, Sprite, Graphics } from "pixi.js";
import { FancyButton, Button } from "@pixi/ui";

export class JoinGameScreen extends Container {

    private background: Sprite;
    private container: FancyButton;
    private gameJoinLabel: FancyButton;

    constructor() {
        super();

        this.background = Sprite.from('./src/assets/mainBackground.jpg');

        this.container = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xffcc66, 0.5)
                        .drawRoundedRect(0, 0, 300, 150, 15)
            )).view,
            anchor: 0.5,
        });
        
        this.gameJoinLabel = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xffcc66)
                        .drawRoundedRect(0, 0, 300, 150, 15)
            )).view,
            text: 'Join Game',
            anchor: 0.5,
        });

        this.addChild(this.background);
        this.addChild(this.container);
        this.addChild(this.gameJoinLabel);
    }

    public async show() {
    }

    public async hide() {
    }

    public resize(width: number, height: number) {
        this.container.view.x = width * 0.5;
        this.container.view.y = height * 0.5;
        this.container.view.width = width * 0.5;
        this.container.view.height = height * 0.7;

        this.gameJoinLabel.view.height = this.container.view.height * 0.2;
        this.gameJoinLabel.view.width = this.container.view.width * 0.8;
        this.gameJoinLabel.view.x = this.container.view.x;
        this.gameJoinLabel.view.y = this.container.view.y - this.container.view.height * 0.35;

        this.background.height = height;
        this.background.width = width;
        this.background.x = 0;
        this.background.y = 0;
    }


}