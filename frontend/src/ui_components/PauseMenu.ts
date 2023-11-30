import { Container } from "pixi.js";
import { Background } from "../ui_components/Background";
import { MenuContainer } from "../ui_components/MenuContainer";
import { BackButton } from "../ui_components/BackButton";
import { SizedButton } from "../ui_components/SizedButton";
import { SettingsScreen } from "../screens/SettingsScreen";

export class PauseMenu extends Container {

    private vignette: Background;
    private menuContainer: MenuContainer;
    private backButton: BackButton;

    private pauseLabel: SizedButton;
    private settingsButton: SizedButton;
    private exitGame: SizedButton;

    private settingsScreen: SettingsScreen;

    constructor() {
        super();

        this.visible = false;

        this.vignette = new Background();
        this.addChild(this.vignette);

        this.menuContainer = new MenuContainer();
        this.addChild(this.menuContainer);

        this.backButton = new BackButton(0.985, 0.015, this.menuContainer.width, this.menuContainer.height);
        this.menuContainer.addChild(this.backButton);
        this.backButton.onPress.connect(() => {
            this.visible = false;
        });

        this.pauseLabel = new SizedButton(0.5, 0.16, 0.5, 0.25, "Pause Menu", this.menuContainer.width, this.menuContainer.height, 50, 0xffcc66);
        this.menuContainer.addChild(this.pauseLabel);

        this.settingsButton = new SizedButton(0.5, 0.5, 0.55, 0.2, "Settings", this.menuContainer.width, this.menuContainer.height, 50, 0x9933aa);
        this.menuContainer.addChild(this.settingsButton);

        this.exitGame = new SizedButton(0.5, 0.75, 0.55, 0.2, "Exit Game", this.menuContainer.width, this.menuContainer.height, 50, 0x9933aa);
        this.menuContainer.addChild(this.exitGame);

        this.settingsScreen = new SettingsScreen();
        this.settingsButton.onPress.connect(() => {
            this.settingsScreen.visible = true;
        });
        this.addChild(this.settingsScreen);

        this.visible = false;
    }

    resize(width: number, height: number) {

        this.vignette.resize(width, height);
        this.menuContainer.resize(width, height);
        this.backButton.resize(this.menuContainer.getBox());
        this.pauseLabel.resize(this.menuContainer.getBox());
        this.settingsButton.resize(this.menuContainer.getBox());
        this.exitGame.resize(this.menuContainer.getBox());
        this.settingsScreen.resize(width, height);

    }
}