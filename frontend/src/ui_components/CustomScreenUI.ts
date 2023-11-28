import { Container, Graphics } from "pixi.js";
import { MenuContainer } from "./MenuContainer";
import { BackButton } from "./BackButton";
import { SizedButton } from "./SizedButton";
import { SeedBox } from '../ui_components/SeedBox';


export class CustomScreenUI extends Container {

    private vignette: Graphics;
    private menuContainer: MenuContainer;
    private backButton: BackButton;
    private customLabel: SizedButton;
    private seedBox: SeedBox;


    constructor() {
        super();

        this.visible = false;

        this.vignette = new Graphics()
            .beginFill(0x000000)
            .drawRect(0,0,10,10);
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

    }

    public getSeed() {
        return this.seedBox.seed.value;
    }

    public resize(width: number, height: number) {
        this.vignette.width = width;
        this.vignette.height = height;
        this.menuContainer.resize(width, height);
        this.backButton.resize(this.menuContainer.getBox());
        this.customLabel.resize(this.menuContainer.getBox());
        this.seedBox.resize(this.menuContainer.getBox());


    }


}