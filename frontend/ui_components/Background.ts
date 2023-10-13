import { Container, Sprite, ObservablePoint } from "pixi.js";

export class Background extends Container {

    public background: Sprite;

    constructor() {
        super();
        this.background = Sprite.from('./src/assets/mainBackground.jpg');
        this.background.anchor = new ObservablePoint(() => {}, null, 0.5, 0.5);
        this.addChild(this.background);
    }

    public getBackground() {
        return this.background;
    }

    public resize(width: number, height: number) {
        if (width/height >= 1920/768) {
            this.background.width = width;
            this.background.height = width * 768 / 1920;
        } else {
            this.background.height = height;
            this.background.width = height * 1920 / 768;
        }
        this.background.x = width * 0.5;
        this.background.y = height * 0.5;

    }
}