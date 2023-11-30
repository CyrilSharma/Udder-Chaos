import { Container } from "pixi.js";
import { MenuContainer } from "./MenuContainer";
import { BackButton } from "./BackButton";
import { SizedButton } from "./SizedButton";
import { SeedBox } from '../ui_components/SeedBox';
import { SliderUI } from './SliderUI';
import { Background } from "./Background";
import { GameSettings, gameSettings } from "../game/GameSettings";
import { gameSettingsData } from "../game/Utils";
import server from '../server';

export class CustomScreenUI extends Container {

    private vignette: Background;
    private menuContainer: MenuContainer;
    private backButton: BackButton;
    private customLabel: SizedButton;
    private seedBox: SeedBox;
    private deckSize: SliderUI;
    private difficulty: SliderUI;
    private daysPerRound: SliderUI;
    private cowSacrificeAmt: SliderUI;
    private cowsWin: SliderUI;
    private cowsRespawn: SliderUI;
    private timerLength: SliderUI;

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
            const newSettings = {
                seed: Number(this.getSeed()),
                score_goal: this.getCowsForWin(),
                days_per_round: this.getDaysPerRound(),
                cow_regen_rate: this.getCowRespawnRate(),
                cow_sacrifice: this.getCowSacrificeAmt(),
                card_deck_size: this.getDeckSize(),
                timer_length: gameSettings.getValue("timer_length"),
                difficulty: this.getDifficulty(),
            }
            gameSettings.save(newSettings);
            server.updateGameSettings(newSettings);
        });

        this.customLabel = new SizedButton(0.32, 0.12, 0.5, 0.2, "Customize Game", this.menuContainer.width, this.menuContainer.height, 50, 0xffcc66);
        this.menuContainer.addChild(this.customLabel);

        this.seedBox = new SeedBox(this.menuContainer, 0.78, 0.12, 0.3, 0.15, " ", 6);
        this.menuContainer.addChild(this.seedBox);

        this.deckSize = new SliderUI(0.25, 0.35, 0.45, 0.15, this.menuContainer.width, this.menuContainer.height, "Deck Size", 10, 20, 20, this.menuContainer.getBox());
        this.menuContainer.addChild(this.deckSize);

        this.difficulty = new SliderUI(0.25, 0.52, 0.45, 0.15, this.menuContainer.width, this.menuContainer.height, "AI Difficulty", 100, 1000, 20, this.menuContainer.getBox());
        this.menuContainer.addChild(this.difficulty);

        this.daysPerRound = new SliderUI(0.25, 0.69, 0.45, 0.15, this.menuContainer.width, this.menuContainer.height, "Days Per Round", 4, 18, 20, this.menuContainer.getBox());
        this.menuContainer.addChild(this.daysPerRound);

        this.cowSacrificeAmt = new SliderUI(0.75, 0.35, 0.45, 0.15, this.menuContainer.width, this.menuContainer.height, "Cows per Sacrifice", 1, 20, 20, this.menuContainer.getBox());
        this.menuContainer.addChild(this.cowSacrificeAmt);

        this.cowsWin = new SliderUI(0.75, 0.52, 0.45, 0.15, this.menuContainer.width, this.menuContainer.height, "Cows Needed For Win", 1, 50, 20, this.menuContainer.getBox());
        this.menuContainer.addChild(this.cowsWin);

        this.cowsRespawn = new SliderUI(0.75, 0.69, 0.45, 0.15, this.menuContainer.width, this.menuContainer.height, "Cow Respawn Time", 1, 30, 20, this.menuContainer.getBox());
        this.menuContainer.addChild(this.cowsRespawn);

        this.timerLength = new SliderUI(0.25, 0.86, 0.45, 0.15, this.menuContainer.width, this.menuContainer.height, "Move Timer Length", 10, 60, 20, this.menuContainer.getBox());
        this.menuContainer.addChild(this.timerLength);

        this.loadGameSettings();
        this.resize(window.innerWidth, window.innerHeight);
    }

    public loadGameSettings() {
        const settingsData: gameSettingsData = gameSettings.load();
        this.setSeed(settingsData.seed);
        this.setCowsForWin(settingsData.score_goal);
        this.setDaysPerRound(settingsData.days_per_round);
        this.setCowRespawnRate(settingsData.cow_regen_rate);
        this.setCowSacrificeAmt(settingsData.cow_sacrifice);
        this.setDeckSize(settingsData.card_deck_size);
        this.setDifficulty(settingsData.difficulty);
        this.setDifficulty(500);
    }

    public getSeed() {
        return this.seedBox.seed.value;
    }

    public setSeed(val: number) {
        this.seedBox.changeSeed(String(val));
    }

    public getDeckSize() : number {
        return this.deckSize.getValue();
    }

    public setDeckSize(val: number) {
        this.deckSize.setValue(val);
    }

    public getDifficulty() : number {
        return this.difficulty.getValue();
    }

    public setDifficulty(val: number) {
        this.difficulty.setValue(val);
    }

    public getDaysPerRound() : number {
        return this.daysPerRound.getValue();
    }

    public setDaysPerRound(val: number) {
        this.daysPerRound.setValue(val);
    }

    public getCowSacrificeAmt() : number {
        return this.cowSacrificeAmt.getValue();
    }

    public setCowSacrificeAmt(val: number) {
        this.cowSacrificeAmt.setValue(val);
    }

    public getCowsForWin() : number {
        return this.cowsWin.getValue();
    }

    public setCowsForWin(val: number) {
        this.cowsWin.setValue(val);
    }

    public getCowRespawnRate() : number {
        return this.cowsRespawn.getValue();
    }

    public setCowRespawnRate(val: number) {
        this.cowsRespawn.setValue(val);
    }

    public getTimerLength() : number {
        return this.timerLength.getValue();
    }

    public setTimerLength(val: number) {
        this.timerLength.setValue(val);
    }

    public resize(width: number, height: number) {
        this.vignette.resize(width, height);
        this.menuContainer.resize(width, height);
        this.backButton.resize(this.menuContainer.getBox());
        this.customLabel.resize(this.menuContainer.getBox());
        this.seedBox.resize(this.menuContainer.getBox());

        this.deckSize.resize(this.menuContainer.getBox());
        this.difficulty.resize(this.menuContainer.getBox());
        this.daysPerRound.resize(this.menuContainer.getBox());
        this.cowSacrificeAmt.resize(this.menuContainer.getBox());
        this.cowsWin.resize(this.menuContainer.getBox());
        this.cowsRespawn.resize(this.menuContainer.getBox());
        this.timerLength.resize(this.menuContainer.getBox());
    }


}