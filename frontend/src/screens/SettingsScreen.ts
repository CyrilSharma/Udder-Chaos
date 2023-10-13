import { Container, Graphics } from "pixi.js";
import { FancyButton, Button } from "@pixi/ui";
import { navigation } from "../utils/navigation";
import { HomeScreen } from "./HomeScreen";
import { Background } from "../../ui_components/Background";
import { ButtonBox } from "../../ui_components/ButtonBox";
import { MenuButton } from "../../ui_components/MenuButton";

export class SettingsScreen extends Container {

    private background: Background;
    private container: ButtonBox;
    private backButton: FancyButton;
    private settingsLabel: MenuButton;

    constructor() {
        super();

        this.background = new Background();
        this.addChild(this.background);

        this.container = new ButtonBox(1, 0.9, 10);
        this.addChild(this.container);

        // this.settingsLabel = new MenuButton("Settings", 0, 0, 0xffcc66, 4, 0.8, 10);
        // this.container.addChild(this.settingsLabel);

        this.settingsLabel = new MenuButton("Settings", 0.5, 0.2, 0xffcc66, 4, 0.2, 30);
        this.addChild(this.settingsLabel);

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

        this.backButton.onPress.connect(() => {
            navigation.showScreen(HomeScreen);
        });
        
        this.addChild(this.backButton);
    }

    public async show() {
    }

    public async hide() {
    }

    public resize(width: number, height: number) {
        this.container.resize(width, height);
        this.settingsLabel.resize(width, height);
        // this.settingsLabel.resize(this.container.width, this.container.height);

        this.background.resize(width, height);

        this.backButton.view.x = this.container.getBox().view.x + this.container.getBox().view.width * 0.5;
        this.backButton.view.y = this.container.getBox().view.y - this.container.getBox().view.height * 0.5;
        this.backButton.height = this.container.getBox().view.height * 0.1;
    }
}