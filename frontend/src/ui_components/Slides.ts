import { Sprite, ObservablePoint } from "pixi.js";

const NUM_IMG = 5;

export class Slides extends Sprite {

    private slides: Array<Sprite>;
    private percentX: number;
    private percentY: number;
    private percentWidth: number;
    private percentHeight: number;
    private slideNum: number;

    constructor(x: number, y: number, width: number, height: number, parentW: number, parentH: number) {
        super();

        this.percentWidth = width;
        this.percentHeight = height;
        this.percentX = x;
        this.percentY = y;
        this.slideNum = 0;
        this.width = parentW;
        this.height = parentH;

        this.slides = [];
        for (let i = 1; i <= NUM_IMG; i++) {
            this.slides[i - 1] = Sprite.from("../../images/tutorial_slides/" + i + ".jpg");
            this.slides[i - 1].visible = false;
            this.addChild(this.slides[i - 1]);
            this.slides[i - 1].anchor = new ObservablePoint(() => {}, null, 0.5, 0.5);
        }
        this.slides[0].visible = true;

    }

    public nextImg() {
        this.slides[this.slideNum].visible = false;
        this.slideNum++;
        this.slideNum %= 5;
        this.slides[this.slideNum].visible = true;
    }

    public prevImg() {
        this.slides[this.slideNum].visible = false;
        this.slideNum--;
        if (this.slideNum == -1) {
            this.slideNum = NUM_IMG - 1;
        }
        this.slides[this.slideNum].visible = true;
    }

    public resize(bounds: Array<number>) {
        // Top, bottom, left, right
        this.x = bounds[2] + (bounds[3] - bounds[2]) * this.percentX;
        this.y = bounds[0] + (bounds[1] - bounds[0]) * this.percentY;
        this.width = (bounds[3] - bounds[2]) * this.percentWidth;
        this.height = (bounds[1] - bounds[0]) * this.percentHeight;
        
        this.slides.forEach(img => {
            img.width = this.width / window.innerWidth;
            img.height = this.height / window.innerHeight;
        });
    }

}