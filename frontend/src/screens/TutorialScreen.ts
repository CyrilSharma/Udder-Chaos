import { Container, Text, TextStyle } from "pixi.js";
import { Background } from "../ui_components/Background";
import { MenuContainer } from "../ui_components/MenuContainer";
import { BackButton } from "../ui_components/BackButton";
import { navigation } from "../utils/navigation";
import { HomeScreen } from "./HomeScreen";
import { NavButton } from "../ui_components/NavButton";
import { Slides } from "../ui_components/Slides";

const NUM_IMG = 15;

export class TutorialScreen extends Container {
    public SCREEN_ID = 'tutorial';
    private background: Background;
    private menuContainer: MenuContainer;
    private backButton: BackButton;
    private nextButton: NavButton;
    private prevButton: NavButton;
    private slides: Slides;
    private slideNum: number;
    private text: Text;

    constructor() {
        super();

        // Bckground
        this.background = new Background();
        this.addChild(this.background);

        // Menu Container
        this.menuContainer = new MenuContainer();
        this.addChild(this.menuContainer);

        // Back Button
        this.backButton = new BackButton(0.985, 0.015, this.menuContainer.width, this.menuContainer.height);
        this.menuContainer.addChild(this.backButton);
        this.backButton.onPress.connect(() => {
            navigation.showScreen(HomeScreen);
        });

        // Next Button
        this.nextButton = new NavButton(0.94, 0.9, 0.1, ">", this.menuContainer.width, this.menuContainer.height, 40, 0x5F00FF);
        this.menuContainer.addChild(this.nextButton);
        this.nextButton.onPress.connect(() => {
            if (this.slideNum >= NUM_IMG) {
                return;
            }
            this.slides.nextImg();
            this.slideNum++;
            this.updateText();
        });

        // Prev Button
        this.prevButton = new NavButton(0.16, 0.9, 0.1, "<", this.menuContainer.width, this.menuContainer.height, 40, 0x5F00FF);
        this.menuContainer.addChild(this.prevButton);
        this.prevButton.onPress.connect(() => {
            if (this.slideNum <= 1) {
                return;
            }
            this.slides.prevImg();
            this.slideNum--;
            this.updateText();
        });

        // Slide Deck
        this.slides = new Slides(0.5, 0.4, this.menuContainer.width, this.menuContainer.height);
        this.menuContainer.addChild(this.slides);

        // Slide Num
        this.slideNum = 1;

        // Slide Text
        this.text = new Text("1" + NUM_IMG, new TextStyle({
            fontFamily: "Concert One",
            fontSize: 40,
            fill: "#000000",
            align: "center",
        }));
        this.updateText();
        this.addChild(this.text);

    }

    public updateText() {
        this.text.text = this.slideNum + "/" + NUM_IMG;
    }

    public resize(width: number, height: number) {

        this.background.resize(width, height);
        this.menuContainer.resize(width, height);
        this.backButton.resize(this.menuContainer.getBox());    
        this.nextButton.resize(this.menuContainer.getBox());
        this.prevButton.resize(this.menuContainer.getBox());
        this.slides.resize(this.menuContainer.getBox());
        this.text.x = this.menuContainer.getBox()[2] + this.menuContainer.width * 0.02;
        this.text.y = this.menuContainer.getBox()[0] + this.menuContainer.height * 0.05;

    }

}