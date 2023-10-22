import { Container, Sprite, Graphics, ObservablePoint } from 'pixi.js';
import { FancyButton, Button } from '@pixi/ui';
import { PlayerListDisplay } from "../ui_components/playerListDisplay";
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

        this.startGameButton = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                    .beginFill(0x6666ff)
                    .drawRoundedRect(0, 0, 300, 150, 15)
            )).view,
            text: 'Start',
            anchor: 0.5,
        });

        this.container = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                    .beginFill(0xffcc66, 0.5)
                    .drawRoundedRect(0, 0, 500, 600, 15)
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


        this.gameCodeDisplay = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                    .beginFill(0xffcc66)
                    .drawRoundedRect(0, 0, 300, 150, 60)
            )).view,
            text: "",
        });

        this.playerList = new PlayerListDisplay;
        this.playerList.updateTheList();

        this.startGameButton.onPress.connect(() => {
            server.startGame();
        });
        
        this.backButton.onPress.connect(() => {
            server.leaveRoom();
            navigation.showScreen(HomeScreen);
        });

        this.addChild(this.background);
        this.addChild(this.container);
        this.addChild(this.gameLobbyLabel);
        this.addChild(this.startGameButton);
        this.addChild(this.gameCodeDisplay);
        this.addChild(this.playerList);
        this.addChild(this.backButton);
        
    }

    public async addGameCode(code: string) {
        this.gameCodeDisplay.text = "Code:\n" + code;
    }

    public async show() {
    }

    public async hide() {
    }

    public resize(width: number, height: number) {
        let scale = 0.4 * width / this.container.view.width;
        this.container.view.x = width * 0.5;
        this.container.view.y = height * 0.5;
        this.container.view.width *= scale;
        this.container.view.height *= scale;

        let leftx = this.container.view.x - this.container.view.width / 2;

        scale = 0.2 * width / this.gameLobbyLabel.width;
        this.gameLobbyLabel.view.height *= scale;
        this.gameLobbyLabel.view.width *= scale;
        this.gameLobbyLabel.view.x = this.container.view.x;
        this.gameLobbyLabel.view.y = this.container.view.y - this.container.view.height * 0.35;

        let yoffset = height * 0.125;

        scale = 0.15 * width / this.gameCodeDisplay.view.width;
        this.gameCodeDisplay.view.height *= scale;
        this.gameCodeDisplay.view.width *= scale;
        this.gameCodeDisplay.view.x = leftx + this.container.width * 0.75 - this.gameCodeDisplay.view.width / 2;
        this.gameCodeDisplay.view.y = this.gameLobbyLabel.y + yoffset;

        scale = 0.15 * width / this.playerList.width;
        this.playerList.width *= scale;
        this.playerList.height *= scale;
        this.playerList.text.x = this.playerList.width / 2;
        this.playerList.text.y = this.playerList.height / 2;
        this.playerList.x = leftx + this.container.width * 0.25 - this.playerList.width / 2;
        this.playerList.y = this.gameLobbyLabel.y + yoffset;
        this.playerList.updateTheList();


        this.backButton.view.x = this.container.view.x + this.container.view.width * 0.5;
        this.backButton.view.y = this.container.view.y - this.container.view.height * 0.5;
        this.backButton.height = this.container.height * 0.1;
        this.backButton.width = this.container.height * 0.1;

        scale = 0.1 * width / this.startGameButton.width;
        this.startGameButton.view.y = this.container.view.y + this.container.view.height * 0.4;
        this.startGameButton.view.x = this.container.view.x + this.container.view.x * 0.25;
        this.startGameButton.view.width *= scale;
        this.startGameButton.view.height *= scale;


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