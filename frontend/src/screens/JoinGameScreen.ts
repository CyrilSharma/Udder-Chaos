import { Container, Sprite, Graphics, ObservablePoint } from "pixi.js";
import { FancyButton, Button, Input } from "@pixi/ui";
import { navigation } from "../utils/navigation";
import { HomeScreen } from "./HomeScreen";
import server from "../server";

export class JoinGameScreen extends Container {

    private background: Sprite;
    private container: FancyButton;
    private gameJoinLabel: FancyButton;
    private backButton: FancyButton;
    private joinRoomButton: FancyButton;
    private roomCodeInput: Input;

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

        this.container = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xffcc66, 0.5)
                        .drawRoundedRect(0, 0, 300, 150, 15)
            )).view,
            anchor: 0.5,
        });
        
        this.joinRoomButton = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0x6666ff)
                        .drawRoundedRect(0, 0, 300, 150, 15)
            )).view,
            text: 'Join Room',
            anchor: 0.5,
        });

        this.gameJoinLabel = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xffcc66)
                        .drawRoundedRect(0, 0, 300, 150, 15)
            )).view,
            text: 'Join Game',
            anchor: 0.5,
        });

        this.roomCodeInput = new Input({
            bg: new Graphics()
                .beginFill(0xffffff)
                .drawRect(0, 0, 300, 150),
            placeholder: "Enter Room Code",
            padding: {
                top: 20,
                bottom: 20,
                right: 0,
                left: 150
            }
        });

        this.roomCodeInput.onChange.connect(() => {
            if (this.roomCodeInput.value.length > 4) {
                this.roomCodeInput.value = this.roomCodeInput.value.slice(0, 4);
            }
        });

        this.joinRoomButton.onPress.connect(() => {
            server.joinRoom(this.roomCodeInput.value);
        })

        this.backButton.onPress.connect(() => {
            navigation.showScreen(HomeScreen);
        });

        this.addChild(this.background);
        this.addChild(this.container);
        this.addChild(this.gameJoinLabel);
        this.addChild(this.backButton);
        this.addChild(this.joinRoomButton);
        this.addChild(this.roomCodeInput);
    }

    public async show() {
    }

    public async hide() {
    }

    public resize(width: number, height: number) {
        this.container.view.x = width * 0.5;
        this.container.view.y = height * 0.5;
        this.container.view.width = width * 0.5;
        this.container.view.height = height * 0.7;

        this.gameJoinLabel.view.height = this.container.view.height * 0.2;
        this.gameJoinLabel.view.width = this.container.view.width * 0.8;
        this.gameJoinLabel.view.x = this.container.view.x;
        this.gameJoinLabel.view.y = this.container.view.y - this.container.view.height * 0.35;

        this.backButton.view.x = this.container.view.x + this.container.view.width * 0.5;
        this.backButton.view.y = this.container.view.y - this.container.view.height * 0.5;
        this.backButton.height = this.container.height * 0.1;

        this.joinRoomButton.view.y = this.container.view.y + this.container.view.height * 0.35;
        this.joinRoomButton.view.x = this.container.view.x;
        this.joinRoomButton.view.width = this.container.width * 0.4;
        this.joinRoomButton.view.height = this.container.height * 0.2;

        this.roomCodeInput.y = this.container.view.y;
        this.roomCodeInput.x = this.container.view.x;
        this.roomCodeInput.width = this.container.width * 0.4;
        this.roomCodeInput.height = this.container.height * 0.2;
        this.roomCodeInput.x = this.roomCodeInput.x - this.roomCodeInput.width * 0.5;
        this.roomCodeInput.y = this.roomCodeInput.y - this.roomCodeInput.height * 0.5;
        this.roomCodeInput.paddingLeft = this.roomCodeInput.width * 0.1;

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


}