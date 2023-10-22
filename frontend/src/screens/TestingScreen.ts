import { Container } from 'pixi.js';
import { EndGameScreen } from '../ui_components/EndGameScreen';
import { Background } from '../ui_components/Background';

export class TestingScreen extends Container {

    private background: Background;
    private winGamePopup: EndGameScreen;

    constructor() {
        super();

        this.background = new Background();
        this.addChild(this.background);
        this.winGamePopup = new EndGameScreen(true);
        this.addChild(this.winGamePopup);

    }

    public resize(width: number, height: number) {
        this.winGamePopup.resize(width, height);
        this.background.resize(width, height);
    }

}