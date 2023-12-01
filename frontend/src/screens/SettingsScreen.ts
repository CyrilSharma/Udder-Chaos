import { Container } from "pixi.js";
import { Background } from "../ui_components/Background";
import { MenuContainer } from "../ui_components/MenuContainer";
import { BackButton } from "../ui_components/BackButton";
import { SliderUI } from "../ui_components/SliderUI";
import { SizedButton } from "../ui_components/SizedButton";
import { SoundHandler } from "../game/SoundHandler";
import { globalSettingsData } from "../game/Utils";
import { globalSettings } from "../game/Settings";

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
            const newSettings: globalSettingsData = {
                music_volume: this.getMusicVol() / 100,
                sound_effect_volume: this.getSFXVol() / 100,
            }
            globalSettings.save(newSettings);
        });

        this.settingsLabel = new SizedButton(0.5, 0.16, 0.5, 0.25, "Settings", this.menuContainer.width, this.menuContainer.height, 50, 0xffcc66);
        this.menuContainer.addChild(this.settingsLabel);

        this.sfxVol = new SliderUI(0.5, 0.47, 0.8, 0.3, this.menuContainer.width, this.menuContainer.height, "SFX Volume", 0, 100, 30, this.menuContainer.getBox(), this.changeSFXVolume);
        this.menuContainer.addChild(this.sfxVol);

        this.musicVol = new SliderUI(0.5, 0.77, 0.8, 0.3, this.menuContainer.width, this.menuContainer.height, "Music Volume", 0, 100, 30, this.menuContainer.getBox(), this.changeBGMVolume);
        this.menuContainer.addChild(this.musicVol);

        this.loadGlobalSettings();
    }

    public loadGlobalSettings() {
        const settingsData: globalSettingsData = globalSettings.load();
        this.setSFXVol(Math.floor(settingsData.sound_effect_volume * 100));
        this.setMusicVol(Math.floor(settingsData.music_volume * 100));
    }

    public getSFXVol() : number {
        return this.sfxVol.getValue();
    }

    public setSFXVol(val: number) {
        this.sfxVol.setValue(val);
    }

    public changeSFXVolume(val: number) {
        SoundHandler.changeSFXVolume(val / 100);
    }

    public getMusicVol() : number {
        return this.musicVol.getValue();
    }

    public setMusicVol(val: number) {
        this.musicVol.setValue(val);
    }

    public changeBGMVolume(val: number) {
        SoundHandler.changeBGMVolume(val / 100);
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