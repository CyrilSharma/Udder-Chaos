import { Container, Graphics, Color, RoundedRectangle } from 'pixi.js';
import { Background } from '../ui_components/Background';

import { Button, FancyButton } from '@pixi/ui';
import { PlayerGameInfo } from '../ui_components/PlayerGameInfo';
import { PlayerColorIcon } from '../ui_components/PlayerColorIcon';
import { RoundedTriangle } from '../ui_components/RoundedTriangle';
import { DayCounter } from '../ui_components/DayCounter';
import { ColorSelector } from '../ui_components/ColorSelector';
import { MenuContainer } from '../ui_components/MenuContainer';
import { SizedButton } from '../ui_components/SizedButton';

export class TestingScreen extends Container {

    private background: Background;
    // private leftCol: Container;
    // private rightCol: Container;
    // private board: Container;
    // private player1: PlayerGameInfo;
    // private player2: PlayerGameInfo;
    // private player3: PlayerGameInfo;
    // private player4: PlayerGameInfo;
    // private scoreDisplay: FancyButton;
    // private playerIcon: PlayerColorIcon;
    // private dayCounter: DayCounter;
    // private colorSelector: ColorSelector;
    private menuContainer: MenuContainer;
    private lobbyLabel: SizedButton;
    private codeDisplay: SizedButton;
    private startButton: SizedButton;

    constructor() {
        /** Default Stuff */
        super();
        this.background = new Background();
        this.addChild(this.background);

        /** Testing Stuff */
        // this.leftCol = new Container();
        // this.scoreDisplay = new FancyButton({
        //     defaultView: (new Button(
        //         new Graphics()
        //                 .beginFill(0xffffff)
        //                 .drawCircle(30, 30, 30)
        //     )).view,
        //     text: "#",
        //     padding: 0,
        //     anchor: 0.5,
        // });
        // this.player1 = new PlayerGameInfo(0xFF0000);
        // this.player2 = new PlayerGameInfo(0x0085FF);
        // this.player3 = new PlayerGameInfo(0xAD00FF);
        // this.player4 = new PlayerGameInfo(0xFFAB2E);

        // this.playerIcon = new PlayerColorIcon(0xFF0000);

        // this.dayCounter = new DayCounter();
        // this.dayCounter.scale.x = 0.5;
        // this.dayCounter.scale.y = 0.5;
        // this.dayCounter.onPress.connect(() => this.dayCounter.cycleDay(this.dayCounter));
        // this.leftCol.addChild(this.dayCounter);

        // this.leftCol.addChild(this.player1);
        // this.leftCol.addChild(this.player2);
        // this.leftCol.addChild(this.player3);
        // this.leftCol.addChild(this.player4);
        // this.leftCol.addChild(this.scoreDisplay);
        // this.leftCol.addChild(this.playerIcon);
        // this.addChild(this.leftCol);

        this.menuContainer = new MenuContainer();
        this.lobbyLabel = new SizedButton(0.32, 0.16, 0.5, 0.25, "Game Lobby", this.menuContainer.width, this.menuContainer.height, 60, 0xffcc66);
        this.menuContainer.addChild(this.lobbyLabel);
        
        this.codeDisplay = new SizedButton(0.75, 0.16, 0.3, 0.25, "Code:\nABCD", this.menuContainer.width, this.menuContainer.height, 40, 0xffcc66);
        this.codeDisplay.changeText("Code:\nABCD");
        this.menuContainer.addChild(this.codeDisplay);

        this.startButton = new SizedButton(0.5, 0.9, 0.3, 0.15, "Start Game", this.menuContainer.width, this.menuContainer.height, 40, 0x6060fc);
        this.menuContainer.addChild(this.startButton);

        this.addChild(this.menuContainer);

        // this.board = new Container();
        // this.rightCol = new Container();

        // this.colorSelector = new ColorSelector();
        // this.colorSelector.onPress.connect(() => this.colorSelector.swapColor());
        // this.rightCol.addChild(this.colorSelector);
        // this.addChild(this.rightCol);
    }

    public resize(width: number, height: number) {
        this.background.resize(width, height);
        // this.leftCol.x = width * 0.2;
        // this.leftCol.y = height * 0.5;
        // this.scoreDisplay.y = -210;
        // this.player1.y = -150;
        // this.player2.y = -100;
        // this.player3.y = -50
        // this.player4.y = 0;
        // this.playerIcon.y = 90;
        // this.dayCounter.y = 100;
        // this.dayCounter.x = 400;

        // this.rightCol.x = width * 0.8;
        // this.rightCol.y = height * 0.5;
        this.menuContainer.resize(width, height);
        this.lobbyLabel.resize(this.menuContainer.getBox());
        this.codeDisplay.resize(this.menuContainer.getBox());
        this.startButton.resize(this.menuContainer.getBox());

    }

}