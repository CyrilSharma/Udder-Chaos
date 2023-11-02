import { Container, Sprite, Graphics, ObservablePoint } from "pixi.js";
import { FancyButton, Button, Input } from "@pixi/ui";
import { navigation } from "../utils/navigation";
import { HomeScreen } from "./HomeScreen";
import server from "../server";
import { Background } from "../ui_components/Background";
import { MenuButton } from "../ui_components/MenuButton";
import { ButtonBox } from "../ui_components/ButtonBox";
import { MenuContainer } from "../ui_components/MenuContainer";
import { SizedButton } from "../ui_components/SizedButton";
import { SeedBox } from "../ui_components/SeedBox";
import { BackButton } from "../ui_components/BackButton";
export class JoinGameScreen extends Container {

    private background: Background;
    // private container: ButtonBox;
    // private gameJoinLabel: MenuButton;
    // private joinRoomButton: MenuButton;
    // private roomCodeInput: Input;
    private errorPopup: FancyButton;

    private menuContainer: MenuContainer;
    private joinLabel: SizedButton;
    private joinButton: SizedButton;
    private seedBox: SeedBox;
    private backButton: BackButton;

    constructor() {
        super();

        // Bckground
        this.background = new Background();
        this.addChild(this.background);

        // Button Box
        // this.container = new ButtonBox(1, 0.9, 10);
        // this.addChild(this.container);

        // Menu Container
        this.menuContainer = new MenuContainer();
        this.addChild(this.menuContainer);

        // Game Join Label
        // this.gameJoinLabel = new MenuButton("Join Game", 0.5, 0.3, 0xffcc66, 4, 0.2, 30);
        // this.addChild(this.gameJoinLabel);

        // Join Label
        this.joinLabel = new SizedButton(0.5, 0.16, 0.75, 0.25, "Join Game", this.menuContainer.width, this.menuContainer.height, 60, 0xffcc66);
        this.menuContainer.addChild(this.joinLabel);

        // Join Label
        this.joinButton = new SizedButton(0.5, 0.85, 0.5, 0.25, "Join Room", this.menuContainer.width, this.menuContainer.height, 60, 0x6666ff);
        this.menuContainer.addChild(this.joinButton);

        // Back Button
        this.backButton = new BackButton(0.985, 0.015, this.menuContainer.width, this.menuContainer.height);
        this.menuContainer.addChild(this.backButton);
        this.backButton.onPress.connect(() => {
            navigation.showScreen(HomeScreen);
        });

        // Room Code Input
        this.seedBox = new SeedBox(this.menuContainer, 0.5, 0.5, 0.5, 0.25, "Code", 4);
        this.menuContainer.addChild(this.seedBox);

        this.errorPopup = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xff0000)
                        .drawRoundedRect(0, 0, 300, 150, 15)
            )).view,
            text: '',
            anchor: 0.5,
        });

        this.joinButton.onPress.connect(() => {
            server.joinRoom(this.seedBox.seed.value);
        })

        this.addChild(this.errorPopup);
        this.errorPopup.visible = false;
    }

    public async showError(error: string) {
        this.errorPopup.text = error;
        this.errorPopup.visible = true;
        setTimeout(() => {
            this.errorPopup.visible = false;
        }, 2000);
    }

    public resize(width: number, height: number) {

        this.background.resize(width, height);
        this.menuContainer.resize(width, height);
        this.joinLabel.resize(this.menuContainer.getBox());
        this.joinButton.resize(this.menuContainer.getBox());
        this.seedBox.resize(this.menuContainer.getBox());
        this.backButton.resize(this.menuContainer.getBox());

        //this.gameJoinLabel.resize(width, height);
        // this.gameJoinLabel.view.height = this.container.height * 0.2;
        // this.gameJoinLabel.view.width = this.container.width * 0.8;
        // this.gameJoinLabel.view.x = this.container.x;
        // this.gameJoinLabel.view.y = this.container.y - this.container.height * 0.35;

        // this.backButton.view.x = this.container.x + this.container.width * 0.5;
        // this.backButton.view.y = this.container.y - this.container.height * 0.5;
        // this.backButton.height = this.container.height * 0.1;

        // this.joinRoomButton.resize(width, height);

        // let scale = 0.2 * width / this.roomCodeInput.width;
        // this.roomCodeInput.y = this.container.y;
        // this.roomCodeInput.x = this.container.x;
        // this.roomCodeInput.width *= scale;
        // this.roomCodeInput.height *= scale;
        // this.roomCodeInput.x = this.roomCodeInput.x - this.roomCodeInput.width * 0.5;
        // this.roomCodeInput.y = this.roomCodeInput.y - this.roomCodeInput.height * 0.5;
        // this.roomCodeInput.paddingLeft = this.roomCodeInput.width * 0.5;

        // AR work
        

        this.errorPopup.view.x = width * 0.5;
        this.errorPopup.view.y = height * 0.5;
        this.errorPopup.view.width = width * 0.4;
        this.errorPopup.view.height = width * 0.2;
    }


}