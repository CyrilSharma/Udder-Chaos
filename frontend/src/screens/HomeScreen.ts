import { Button, FancyButton } from '@pixi/ui';
import { Container, Graphics, Sprite } from 'pixi.js';
import { navigation } from '../utils/navigation';
import { CreateGameScreen } from './CreateGameScreen';
import server from "../server";
import { JoinGameScreen } from './JoinGameScreen';

/** Screen shows upon opening the website */
export class HomeScreen extends Container {

    private background: Sprite;
    private createGameButton: FancyButton;
    private joinGameButton: FancyButton;
    private settingsButton: FancyButton;

    constructor() {
        super();

        this.background = Sprite.from('./src/assets/mainBackground.jpg');

        this.createGameButton = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xffcc66)
                        .drawRoundedRect(0, 0, 300, 150, 60)
            )).view,
            pressedView:  (new Button(
                new Graphics()
                        .beginFill(0xffe6b3)
                        .drawRoundedRect(0, 0, 300, 150, 60)
            )).view,
            anchor: 0.5,
            text: "Create Game"
        });

        this.joinGameButton = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xffcc66)
                        .drawRoundedRect(0, 0, 300, 150, 60)
            )).view,
            pressedView:  (new Button(
                new Graphics()
                        .beginFill(0xffe6b3)
                        .drawRoundedRect(0, 0, 300, 150, 60)
            )).view,
            anchor: 0.5,
            text: "Join Game"
        });

        this.settingsButton = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xffcc66)
                        .drawRoundedRect(0, 0, 600, 100, 50)
            )).view,
            pressedView:  (new Button(
                new Graphics()
                        .beginFill(0xffe6b3)
                        .drawRoundedRect(0, 0, 600, 100, 50)
            )).view,
            anchor: 0.5,
            text: "Settings"
        });


        this.createGameButton.onPress.connect(() => {
            server.startRoom();
            server.socket.on("load-room", (roomCode) => {
                navigation.showScreen(CreateGameScreen)
                console.log(roomCode);
                // Call create game screen with roomcode
            });
            server.socket.on("failed-room", () => {
                // Show error
            });
        });

        this.joinGameButton.onPress.connect(() => navigation.showScreen(JoinGameScreen));


        this.addChild(this.background);
        this.addChild(this.createGameButton.view);
        this.addChild(this.joinGameButton.view);
        this.addChild(this.settingsButton);
    }

    public async show() {

        //this.createGameButton.

    }

    public async hide() {
        //this.createGameButton.hide();
    }

    public resize(width: number, height: number) {
        this.createGameButton.view.x = width * 0.25;
        this.createGameButton.view.y = height * 0.65;
        this.createGameButton.view.height = height * 0.2;
        this.createGameButton.view.width = width * 0.35;

        this.joinGameButton.view.x = width * 0.75;
        this.joinGameButton.view.y = height * 0.65;
        this.joinGameButton.view.height = height * 0.2;
        this.joinGameButton.view.width = width * 0.35;

        this.settingsButton.view.x = width * 0.5;
        this.settingsButton.view.y = height * 0.9;
        this.settingsButton.view.height = height * 0.17;
        this.settingsButton.view.width = width * 0.7;

        this.background.height = height;
        this.background.width = width;
        this.background.x = 0;
        this.background.y = 0;
    }

}