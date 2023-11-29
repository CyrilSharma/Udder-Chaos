import { Container } from "pixi.js";
import { Background } from "../ui_components/Background";
import { MenuContainer } from "../ui_components/MenuContainer";
import { BackButton } from "../ui_components/BackButton";
import { SliderUI } from "../ui_components/SliderUI";
import { SizedButton } from "../ui_components/SizedButton";

export class SettingsScreen extends Container {

    private vignette: Background;
    private menuContainer: MenuContainer;
    private backButton: BackButton;

    private settingsLabel: SizedButton;

    private sfxVol: SliderUI;
    private musicVol: SliderUI;

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

        this.settingsLabel = new SizedButton(0.5, 0.16, 0.5, 0.25, "Settings", this.menuContainer.width, this.menuContainer.height, 50, 0xffcc66);
        this.menuContainer.addChild(this.settingsLabel);

        this.sfxVol = new SliderUI(0.5, 0.47, 0.8, 0.3, this.menuContainer.width, this.menuContainer.height, "SFX Volume", 0, 100, 50, 30, this.menuContainer.getBox());
        this.menuContainer.addChild(this.sfxVol);

        this.musicVol = new SliderUI(0.5, 0.77, 0.8, 0.3, this.menuContainer.width, this.menuContainer.height, "Music Volume", 0, 100, 50, 30, this.menuContainer.getBox());
        this.menuContainer.addChild(this.musicVol);
    }

    public getSFXVol() : number {
        return this.sfxVol.getValue();
    }

    public setSFXVol(val: number) {
        this.sfxVol.setValue(val);
    }

    public getMusicVol() : number {
        return this.musicVol.getValue();
    }

    public setMusicVol(val: number) {
        this.musicVol.setValue(val);
    }

    public resize(width: number, height: number) {
        this.vignette.resize(width, height);
        this.menuContainer.resize(width, height);
        this.backButton.resize(this.menuContainer.getBox());
        this.settingsLabel.resize(this.menuContainer.getBox());
        this.sfxVol.resize(this.menuContainer.getBox());
        this.musicVol.resize(this.menuContainer.getBox());
    }


}