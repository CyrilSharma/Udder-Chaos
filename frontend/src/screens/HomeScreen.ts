import {Container, Graphics} from 'pixi.js';
import {Button} from '@pixi/ui';

/** Screen shows upon opening the website */
export class HomeScreen extends Container {

    private createGameButton: Button;

    constructor() {
        super();

        this.createGameButton = new Button(
            new Graphics()
                .beginFill(0x000000)
                .drawRoundedRect(0, 0, 100, 50, 15)
        );
        //this.createGameButton.press(() => );
        console.log('Button Made!');
        this.addChild(this.createGameButton.view);
        this.resize(window.innerWidth, window.innerHeight);
    }

    public async show() {

        //this.createGameButton.

    }

    public async hide() {
        //this.createGameButton.hide();
    }

    public resize(width: number, height: number) {
        this.createGameButton.view.x = width * 0.5;
        this.createGameButton.view.y = height * 0.5;
        // this.currentScreen?.resize?.(width, height);
    }

}