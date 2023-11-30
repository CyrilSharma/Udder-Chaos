import { TextStyle } from 'pixi.js';
import { FancyButton, Input } from '@pixi/ui';
import { SizedButton } from './SizedButton';
import { MenuContainer } from './MenuContainer';

export class SeedBox extends FancyButton {

    public background: SizedButton;
    public seed: Input;

    private numeric: boolean;

    private percentX: number;
    private percentY: number;
    private percentWidth: number;
    private percentHeight: number;

    constructor(menuContainer: MenuContainer,  pX: number, pY: number, pW: number, pH: number, text: string, maxL: number, numeric: boolean) {
        super();

        /* Set up properties */
        this.percentX = pX;
        this.percentY = pY;
        this.percentWidth = pW;
        this.percentHeight = pH;

        this.numeric = numeric;

        this.background = new SizedButton(pX, pY, pW, pH, text, menuContainer.width, menuContainer.height, 40, 0xffffff);

        this.addChild(this.background);

        /* set up name input */
        this.seed = new Input({
            bg: this.background,
            // align: 'center',
            maxLength: maxL,
            placeholder: text,
            textStyle: new TextStyle({
                fontFamily: "Concert One",
                fontSize: 40,
                fill: "#000000",
                align: "center",
            })
        });
        this.seed.alpha = 1;

        this.seed.onChange.connect(() => {
            this.changeSeed(this.seed.value);
        });
        
        this.seed.y = this.background.y - this.background.height * 0.5;
        this.seed.x = this.background.x - this.seed.width * 0.5;

        this.addChild(this.seed);
    }

    public changeSeed(seed: string) {

        if (this.numeric) {
            // Empty String
            if (seed.length === 0) {
                this.background.changeText(seed);
                this.seed.x = this.background.x - this.seed.width * 0.5;
                return;
            }

            // Check if new char is numeric
            let c = seed[seed.length - 1];
            if (c >= '0' && c <= '9') {
                this.background.changeText(seed);
                this.seed.x = this.background.x - this.seed.width * 0.5;
                return;
            }

            this.seed.value = this.seed.value.slice(0, seed.length - 1);

        } else {
            this.background.changeText(seed);
            this.seed.value = seed;
            this.seed.x = this.background.x - this.seed.width * 0.5;
        }
        
    }

    public resize(bounds: Array<number>) {
        // Top, bottom, left, right
        this.x = bounds[2] + (bounds[3] - bounds[2]) * this.percentX;
        this.y = bounds[0] + (bounds[1] - bounds[0]) * this.percentY;
        this.width = (bounds[3] - bounds[2]) * this.percentWidth;
        this.height = (bounds[1] - bounds[0]) * this.percentHeight;
        console.log(this.seed.value);
    }

}



