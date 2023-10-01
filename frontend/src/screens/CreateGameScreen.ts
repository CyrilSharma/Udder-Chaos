import {Container, Graphics, Sprite, Texture, Assets } from 'pixi.js';
import {Button, FancyButton} from '@pixi/ui';



/** Screen shows upon opening the website */
export class CreateGameScreen extends Container {

    private background: Sprite;

    constructor() {
        super();

        Assets.add({alias: 'background', src: '../assets/mainBackground.jpg'});
        this.background = new Sprite(Texture.from('../assets/mainBackground'));

        

        this.addChild(this.background);
    }

    public async show() {
    }

    public async hide() {
    }

    public resize(width: number, height: number) {

    }

}