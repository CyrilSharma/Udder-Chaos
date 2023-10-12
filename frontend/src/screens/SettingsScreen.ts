import { Container, Graphics } from "pixi.js";
import { FancyButton, Button } from "@pixi/ui";
import { navigation } from "../utils/navigation";
import { HomeScreen } from "./HomeScreen";
import { Background } from "../../ui_components/background";
import server from "../server";

export class SettingsScreen extends Container {

    private background: Background;
    private container: FancyButton;
    private backButton: FancyButton;
    private settingsLabel: FancyButton;

    constructor() {
        super();

        this.background = new Background();
        this.addChild(this.background.getBackground());

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

        this.settingsLabel = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xffcc66)
                        .drawRoundedRect(0, 0, 300, 150, 15)
            )).view,
            text: 'Settings',
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

        this.backButton.onPress.connect(() => {
            navigation.showScreen(HomeScreen);
        });

        this.addChild(this.container);
        this.addChild(this.settingsLabel);
        this.addChild(this.backButton);
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

        this.settingsLabel.view.height = this.container.view.height * 0.2;
        this.settingsLabel.view.width = this.container.view.width * 0.8;
        this.settingsLabel.view.x = this.container.view.x;
        this.settingsLabel.view.y = this.container.view.y - this.container.view.height * 0.35;

        this.backButton.view.x = this.container.view.x + this.container.view.width * 0.5;
        this.backButton.view.y = this.container.view.y - this.container.view.height * 0.5;
        this.backButton.height = this.container.height * 0.1;

        this.background.resize(width, height);
    }


}