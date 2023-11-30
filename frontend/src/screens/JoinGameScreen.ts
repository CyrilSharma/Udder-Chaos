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
    public SCREEN_ID = 'join';
    private background: Background;
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

        // Menu Container
        this.menuContainer = new MenuContainer();
        this.addChild(this.menuContainer);

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
        this.seedBox = new SeedBox(this.menuContainer, 0.5, 0.5, 0.5, 0.25, "Code", 4, false);
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

        this.resize(window.innerWidth, window.innerWidth);
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

        this.errorPopup.view.x = width * 0.5;
        this.errorPopup.view.y = height * 0.5;
        this.errorPopup.view.width = width * 0.4;
        this.errorPopup.view.height = width * 0.2;
    }


}