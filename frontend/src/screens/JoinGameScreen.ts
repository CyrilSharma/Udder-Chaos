import { Container, Sprite, Graphics, ObservablePoint } from "pixi.js";
import { FancyButton, Button, Input } from "@pixi/ui";
import { navigation } from "../utils/navigation";
import { HomeScreen } from "./HomeScreen";
import server from "../server";
import { Background } from "../ui_components/Background";
import { MenuButton } from "../ui_components/MenuButton";
import { ButtonBox } from "../ui_components/ButtonBox";
export class JoinGameScreen extends Container {

    private background: Background;
    private container: ButtonBox;
    private gameJoinLabel: MenuButton;
    private backButton: FancyButton;
    private joinRoomButton: MenuButton;
    private roomCodeInput: Input;
    private errorPopup: FancyButton;

    constructor() {
        super();

        // Bckground
        this.background = new Background();
        this.addChild(this.background);

        // Button Box
        this.container = new ButtonBox(1, 0.9, 10);
        this.addChild(this.container);

        // Game Join Label
        this.gameJoinLabel = new MenuButton("Join Game", 0.5, 0.3, 0xffcc66, 4, 0.2, 30);
        this.addChild(this.gameJoinLabel);

        // Join Room Button
        this.joinRoomButton = new MenuButton("Join Room", 0.5, 0.7, 0x6666ff, 2, 0.2, 10);
        this.addChild(this.joinRoomButton);

        // Back Button
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

        // Room Code Input
        this.roomCodeInput = new Input({
            bg: new Graphics()
                .beginFill(0xffffff)
                .drawRect(0, 0, 300, 150),
            placeholder: "Enter Room Code",
            padding: 0
        });

        this.errorPopup = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xff0000)
                        .drawRoundedRect(0, 0, 300, 150, 15)
            )).view,
            text: '',
            anchor: 0.5,
        });

        this.roomCodeInput.onChange.connect(() => {
            this.roomCodeInput.paddingLeft = this.roomCodeInput.width * 0.5;
            if (this.roomCodeInput.value.length > 4) {
                this.roomCodeInput.value = this.roomCodeInput.value.slice(0, 4);
            }
        });

        this.joinRoomButton.getButton().onPress.connect(() => {
            server.joinRoom(this.roomCodeInput.value);
        })

        this.backButton.onPress.connect(() => {
            navigation.showScreen(HomeScreen);
        });

        this.addChild(this.backButton);
        this.addChild(this.roomCodeInput);
        this.addChild(this.errorPopup);
        this.errorPopup.visible = false;
    }

    public async show() {
    }

    public async hide() {
    }

    public async showError(error: string) {
        this.errorPopup.text = error;
        this.errorPopup.visible = true;
        setTimeout(() => {
            this.errorPopup.visible = false;
        }, 2000);
    }

    public resize(width: number, height: number) {
        this.container.x = width * 0.5;
        this.container.y = height * 0.5;
        this.container.width = width * 0.5;
        this.container.height = height * 0.7;

        this.gameJoinLabel.resize(width, height);
        // this.gameJoinLabel.view.height = this.container.height * 0.2;
        // this.gameJoinLabel.view.width = this.container.width * 0.8;
        // this.gameJoinLabel.view.x = this.container.x;
        // this.gameJoinLabel.view.y = this.container.y - this.container.height * 0.35;

        this.backButton.view.x = this.container.x + this.container.width * 0.5;
        this.backButton.view.y = this.container.y - this.container.height * 0.5;
        this.backButton.height = this.container.height * 0.1;

        this.joinRoomButton.resize(width, height);
        // this.joinRoomButton.view.y = this.container.y + this.container.height * 0.35;
        // this.joinRoomButton.view.x = this.container.x;
        // this.joinRoomButton.view.width = this.container.width * 0.4;
        // this.joinRoomButton.view.height = this.container.height * 0.2;

        let scale = 0.2 * width / this.roomCodeInput.width;
        this.roomCodeInput.y = this.container.y;
        this.roomCodeInput.x = this.container.x;
        this.roomCodeInput.width *= scale;
        this.roomCodeInput.height *= scale;
        this.roomCodeInput.x = this.roomCodeInput.x - this.roomCodeInput.width * 0.5;
        this.roomCodeInput.y = this.roomCodeInput.y - this.roomCodeInput.height * 0.5;
        this.roomCodeInput.paddingLeft = this.roomCodeInput.width * 0.5;

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

        this.errorPopup.view.x = width * 0.5;
        this.errorPopup.view.y = height * 0.5;
        this.errorPopup.view.width = width * 0.4;
        this.errorPopup.view.height = width * 0.2;
    }


}