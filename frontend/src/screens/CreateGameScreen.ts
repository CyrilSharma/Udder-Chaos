import { Container, Sprite, Graphics, ObservablePoint } from 'pixi.js';
import { FancyButton, Button } from '@pixi/ui';
import { PlayerListDisplay } from "../utils/playerListDisplay";
import { navigation } from '../utils/navigation';
import server from "../server";
import { HomeScreen } from './HomeScreen';

/** Screen shows upon opening the website */
export class CreateGameScreen extends Container {

    private background: Sprite;
    private gameLobbyLabel: FancyButton;
    private container: FancyButton;
    private startGameButton: FancyButton;
    private gameCodeDisplay: FancyButton;
    private playerList: PlayerListDisplay;
    private backButton: FancyButton;

    constructor() {
        super();

        console.log("new screen!")

        this.background = Sprite.from('./src/assets/mainBackground.jpg');
        this.background.anchor = new ObservablePoint(() => {}, null, 0.5, 0.5);

        this.backButton = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xff0000, 0.5)
                        .drawCircle(30, 30, 30)
            )).view,
            text: "X",
            padding: 0,
            anchor: 0.5,
        });

        this.container = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xffcc66, 0.5)
                        .drawRoundedRect(0, 0, 300, 150, 15)
            )).view,
            anchor: 0.5,
        });
        
        this.gameLobbyLabel = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xffcc66)
                        .drawRoundedRect(0, 0, 300, 150, 15)
            )).view,
            text: 'Game Lobby',
            anchor: 0.5,
        });

        this.startGameButton = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0x6666ff)
                        .drawRoundedRect(0, 0, 300, 150, 15)
            )).view,
            text: 'Start',
            anchor: 0.5,
        });

        this.gameCodeDisplay = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xffcc66)
                        .drawRoundedRect(0, 0, 300, 150, 60)
            )).view,
            text: "",
            anchor: 0.5,
        });

        this.playerList = new PlayerListDisplay;
        this.playerList.updateTheList();

        this.startGameButton.onPress.connect(() => {
            server.startGame();
        });
        
        this.backButton.onPress.connect(() => {
            //server.killRoom();
            navigation.showScreen(HomeScreen);
        });

        this.addChild(this.background);
        this.addChild(this.container);
        this.addChild(this.gameLobbyLabel);
        this.addChild(this.startGameButton);
        this.addChild(this.gameCodeDisplay);
        this.addChild(this.playerList.theList);
        this.addChild(this.backButton);
        
    }

    public async addGameCode(code: string) {
        console.log("Screen")
        console.log(this);
        this.gameCodeDisplay.text = "Code:\n" + code;
    }

    public async show() {
    }

    public async hide() {
    }

    public resize(width: number, height: number) {

        this.gameCodeDisplay.view.x = width * 0.62;
        this.gameCodeDisplay.view.y = height * 0.5;
        this.gameCodeDisplay.view.height = height * 0.2;
        this.gameCodeDisplay.view.width = this.gameCodeDisplay.view.height * 1.5;
        this.addGameCode("CHSG");

        this.container.view.x = width * 0.5;
        this.container.view.y = height * 0.5;
        this.container.view.width = width * 0.5;
        this.container.view.height = height * 0.7;

        this.backButton.view.x = this.container.view.x + this.container.view.width * 0.5;
        this.backButton.view.y = this.container.view.y - this.container.view.height * 0.5;
        this.backButton.height = this.container.height * 0.1;

        this.gameLobbyLabel.view.height = this.container.view.height * 0.2;
        this.gameLobbyLabel.view.width = this.container.view.width * 0.8;
        this.gameLobbyLabel.view.x = this.container.view.x;
        this.gameLobbyLabel.view.y = this.container.view.y - this.container.view.height * 0.35;

        this.startGameButton.view.y = this.container.view.y + this.container.view.height * 0.4;
        this.startGameButton.view.x = this.container.view.x + this.container.view.x * 0.25;
        this.startGameButton.view.width = this.container.width * 0.3;
        this.startGameButton.view.height = this.container.height * 0.1;

        this.playerList.theList.view.x = width * 0.38;
        this.playerList.theList.view.y = height * 0.52;
        this.playerList.theList.view.width = width * 0.2;
        this.playerList.theList.view.height = height * 0.2;
        // if (!(this.playerList.numPlayers() >= 4)) {
        //     this.playerList.addPlayer("Jim");
        // }
        this.playerList.updateTheList();

        // AR work
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

    public getPlayerList() {
        return this.playerList;
    }
}