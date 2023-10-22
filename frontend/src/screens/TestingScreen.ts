import { Container, Graphics, Color } from 'pixi.js';
import { Background } from '../ui_components/Background';

import { Button, FancyButton } from '@pixi/ui';
import { PlayerGameInfo } from '../ui_components/PlayerGameInfo';


export class TestingScreen extends Container {

    private background: Background;
    private leftCol: Container;
    private rightCol: Container;
    private board: Container;
    private player1: PlayerGameInfo;
    private player2: PlayerGameInfo;
    private player3: PlayerGameInfo;
    private player4: PlayerGameInfo;
    private scoreDisplay: FancyButton;

    constructor() {
        /** Default Stuff */
        super();
        this.background = new Background();
        this.addChild(this.background);

        /** Testing Stuff */
        this.leftCol = new Container();
        this.scoreDisplay = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xffffff)
                        .drawCircle(30, 30, 30)
            )).view,
            text: "#",
            padding: 0,
            anchor: 0.5,
        });
        this.player1 = new PlayerGameInfo(new Color(0xFF0000));
        this.player2 = new PlayerGameInfo(new Color(0x0085FF));
        this.player3 = new PlayerGameInfo(new Color(0xAD00FF));
        this.player4 = new PlayerGameInfo(new Color(0xFFAB2E));

        this.leftCol.addChild(this.player1);
        this.leftCol.addChild(this.player2);
        this.leftCol.addChild(this.player3);
        this.leftCol.addChild(this.player4);
        this.leftCol.addChild(this.scoreDisplay);
        this.addChild(this.leftCol);

        this.board = new Container();
        this.rightCol = new Container();
    }

    public resize(width: number, height: number) {
        this.background.resize(width, height);
        this.leftCol.x = width * 0.2;
        this.leftCol.y = height * 0.5;
        this.scoreDisplay.y = -210;
        this.player1.y = -150;
        this.player2.y = -100;
        this.player3.y = -50
        this.player4.y = 0;

    }

}