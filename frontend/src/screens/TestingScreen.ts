import { Container, Graphics } from 'pixi.js';
import { Background } from '../ui_components/Background';
import { Button, FancyButton } from '@pixi/ui';
import { PlayerGameInfo } from '../ui_components/PlayerGameInfo';
import { PlayerColorIcon } from '../ui_components/PlayerColorIcon';
import { DayCounter } from '../ui_components/DayCounter';
import { GamePanel } from '../ui_components/GamePanel';
import { RoundedTriangle } from '../ui_components/RoundedTriangle';

export class TestingScreen extends Container {

    private background: Background;
    private leftCol: Container;
    private player1: PlayerGameInfo;
    private player2: PlayerGameInfo;
    private player3: PlayerGameInfo;
    private player4: PlayerGameInfo;
    private scoreDisplay: FancyButton;
    private playerIcon: PlayerColorIcon;
    private dayCounter: DayCounter;
    private gamePanel: GamePanel;
    private rT: RoundedTriangle;

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
        this.player1 = new PlayerGameInfo(0xFF0000);
        this.player2 = new PlayerGameInfo(0x0085FF);
        this.player3 = new PlayerGameInfo(0xAD00FF);
        this.player4 = new PlayerGameInfo(0xFFAB2E);

        this.playerIcon = new PlayerColorIcon(0xFF0000);

        this.dayCounter = new DayCounter(5);
        this.dayCounter.scale.x = 0.5;
        this.dayCounter.scale.y = 0.5;
        this.dayCounter.onPress.connect(() => this.dayCounter.cycleDay(this.dayCounter));
        this.leftCol.addChild(this.dayCounter);

        this.leftCol.addChild(this.player1);
        this.leftCol.addChild(this.player2);
        this.leftCol.addChild(this.player3);
        this.leftCol.addChild(this.player4);
        this.leftCol.addChild(this.scoreDisplay);
        this.leftCol.addChild(this.playerIcon);
        this.addChild(this.leftCol);

        this.rT = new RoundedTriangle(7);
        this.rT.angle = 25.714;
        this.addChild(this.rT);
        this.rT.visible = false;

        this.gamePanel = new GamePanel(0.88, 0.5, 0.2, 0.95, 200, 950, 0xffffff);
        this.addChild(this.gamePanel);
        //this.dayCounter.visible = false;

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
        this.playerIcon.y = 90;
        this.dayCounter.y = 100;
        this.dayCounter.x = 400;
        this.rT.x = width / 2;
        this.rT.y = height / 2;
        this.gamePanel.resize(width, height);
    }

}