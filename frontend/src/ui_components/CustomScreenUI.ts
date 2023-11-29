import { Container } from "pixi.js";
import { MenuContainer } from "./MenuContainer";
import { BackButton } from "./BackButton";
import { SizedButton } from "./SizedButton";
import { SeedBox } from '../ui_components/SeedBox';
import { SliderUI } from './SliderUI';
import { Background } from "./Background";

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

        this.customLabel = new SizedButton(0.32, 0.12, 0.5, 0.2, "Customize Game", this.menuContainer.width, this.menuContainer.height, 50, 0xffcc66);
        this.menuContainer.addChild(this.customLabel);

        this.seedBox = new SeedBox(this.menuContainer, 0.78, 0.12, 0.3, 0.15, "Seed", 6);
        this.menuContainer.addChild(this.seedBox);

        this.deckSize = new SliderUI(0.25, 0.4, 0.45, 0.2, this.menuContainer.width, this.menuContainer.height, "Deck Size", 10, 20, 30, this.menuContainer.getBox());
        this.menuContainer.addChild(this.deckSize);

        this.difficulty = new SliderUI(0.25, 0.6, 0.45, 0.2, this.menuContainer.width, this.menuContainer.height, "AI Difficulty", 1, 5, 30, this.menuContainer.getBox());
        this.menuContainer.addChild(this.difficulty);

        this.daysPerRound = new SliderUI(0.25, 0.8, 0.45, 0.2, this.menuContainer.width, this.menuContainer.height, "Days Per Round", 4, 18, 30, this.menuContainer.getBox());
        this.menuContainer.addChild(this.daysPerRound);

        this.cowSacrificeAmt = new SliderUI(0.75, 0.4, 0.45, 0.2, this.menuContainer.width, this.menuContainer.height, "Cows per Sacrifice", 1, 20, 30, this.menuContainer.getBox());
        this.menuContainer.addChild(this.cowSacrificeAmt);

        this.cowsWin = new SliderUI(0.75, 0.6, 0.45, 0.2, this.menuContainer.width, this.menuContainer.height, "Cows Needed For Win", 1, 50, 30, this.menuContainer.getBox());
        this.menuContainer.addChild(this.cowsWin);

        this.cowsRespawn = new SliderUI(0.75, 0.8, 0.45, 0.2, this.menuContainer.width, this.menuContainer.height, "Cow Respawn Time", 1, 30, 30, this.menuContainer.getBox());
        this.menuContainer.addChild(this.cowsRespawn);

    }

    public getSeed() {
        return this.seedBox.seed.value;
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
    }


}