import { Container, Graphics, Text, TextStyle, Sprite, Color } from 'pixi.js';
import { FancyButton, Button, Input } from '@pixi/ui';
import { SizedButton } from './SizedButton';
import { MenuContainer } from './MenuContainer';

export class SeedBox extends FancyButton {

    private background: SizedButton;
    private seed: Input;

    private percentX: number;
    private percentY: number;
    private percentWidth: number;
    private percentHeight: number;

    constructor(menuContainer: MenuContainer,  pX: number, pY: number, pW: number, pH: number) {
        super();

        /* Set up properties */
        this.percentX = pX;
        this.percentY = pY;
        this.percentWidth = pW;
        this.percentHeight = pH;

        this.background = new SizedButton(pX, pY, pW, pH, "Seed", menuContainer.width, menuContainer.height, 40, 0xffffff);

        this.addChild(this.background);

        /* set up name input */
        this.seed = new Input({
            bg: this.background,
            maxLength: 6,
            textStyle: new TextStyle({
                fontFamily: "Concert One",
                fontSize: 40,
                fill: "#000000",
                align: "center",
            }),
        });
        this.seed.alpha = 1;
        this.seed.onChange.connect(() => {
            this.background.changeText(this.seed.value);
            this.seed.x = this.background.x - this.seed.width * 0.5;

        });
        //this.seed.x = this.background.x - this.seed.width * 0.5;
        
        this.seed.value = "Seed";
        this.seed.y = this.background.y - this.seed.height * 0.8;
        this.seed.x = this.background.x - this.seed.width * 0.5;
        //this.seed.value = "";

        this.addChild(this.seed);

    }

    public resize(bounds: Array<number>) {
        // Top, bottom, left, right
        this.x = bounds[2] + (bounds[3] - bounds[2]) * this.percentX;
        this.y = bounds[0] + (bounds[1] - bounds[0]) * this.percentY;
        this.width = (bounds[3] - bounds[2]) * this.percentWidth;
        this.height = (bounds[1] - bounds[0]) * this.percentHeight;
    }

}



