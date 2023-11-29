import { Container, FederatedPointerEvent, Text, TextStyle } from "pixi.js";
import { SizedButton } from "./SizedButton";

export class SliderUI extends Container {

    private slide: SizedButton;
    private slider: SizedButton;

    private min: number;
    private max: number;
    private value: number;

    private label: Text;
    private minLabel: Text;
    private maxLabel: Text;
    private valueLabel: Text;

    private pBounds: Array<number>;

    constructor(x: number, y: number, width: number, height: number, parentW: number, parentH: number, label: string, min: number, max: number, initial: number, fontSize: number, bounds: Array<number>) {
        super();

        this.slide = new SizedButton(x, y, width, height / 3, "", parentW, parentH, 10, 0x50a0d0);
        this.addChild(this.slide);

        this.slider = new SizedButton(x - width / 2 + height / 10, y, height / 5, height / 3, "", parentW, parentH, 10, 0x50d0a0);
        this.addChild(this.slider);

        this.min = min;
        this.max = max;
        this.value = initial;

        this.label = new Text(label, new TextStyle({
            fontFamily: "Concert One",
            fontSize: fontSize,
            fill: "#ffffff",
            align: "center",
        }));
        this.addChild(this.label);

        this.minLabel = new Text(min, new TextStyle({
            fontFamily: "Concert One",
            fontSize: 2 * fontSize / 3,
            fill: "#ffffff",
            align: "center",
        }));
        this.addChild(this.minLabel);

        this.maxLabel = new Text(max, new TextStyle({
            fontFamily: "Concert One",
            fontSize: 2 * fontSize / 3,
            fill: "#ffffff",
            align: "center",
        }));
        this.addChild(this.maxLabel);

        this.valueLabel = new Text(this.value, new TextStyle({
            fontFamily: "Concert One",
            fontSize: fontSize / 1.1,
            fill: "#8866cc",
            align: "center",
        }));
        this.addChild(this.valueLabel);

        this.slider.onDown.connect(() => {
            const sliderUI = this;

            document.addEventListener("pointermove", moveSlider, false);
            function moveSlider(e: PointerEvent) {
                sliderUI.setSlide(e.x);
            }

            this.slider.onUp.connect(() => {
                document.removeEventListener("pointermove", moveSlider, false);
            });
            
        });

        this.pBounds = bounds;
        this.setValue(initial);
    }

    public getValue() {
        return this.value;
    }
    
    public setValue(value: number) {
        if (value < this.min) {
            this.value = this.min;
        } else if (value > this.max) {
            this.value = this.max;
        } else {
            this.value = value;
        }
        this.valueLabel.text = this.value;
        let increment = (this.slide.width - this.slider.width) / (this.max - this.min);
        let diff = this.value - this.min;
        this.slider.setX(((this.slide.x - this.slide.width / 2) + (diff * increment) - this.slider.width) / (this.pBounds[3] - this.pBounds[2]), this.pBounds);
    }

    private setSlide(x: number) {
        let increment = (this.slide.width - this.slider.width) / (this.max - this.min);
        let dist = 100000;
        let index = 0;
        for (let i = 0; i < this.max - this.min + 1; i++) {
            let tmp = Math.abs(x - ((this.slide.x) - (this.slide.width)/2 + this.slider.width/2 + i * increment));
            if (tmp < dist) {
                dist = tmp;
                index = i;
            } else {
                break;
            }
        }
        let tmp = (index * increment) + (this.slide.x - this.slide.width / 2 + this.slider.width / 2);
        let tmpX = tmp - this.pBounds[2];
        tmpX /= (this.pBounds[3] - this.pBounds[2]);
        this.slider.setX(tmpX, this.pBounds);
        this.value = this.min + index;
        this.updateValue();
    }

    private updateValue() {
        this.valueLabel.text = this.value;
    }

    public resize(bounds: Array<number>) {
        // Top, bottom, left, right
        this.pBounds = bounds;

        this.slide.resize(bounds);
        this.slider.resize(bounds);

        this.label.x = this.slide.x - this.label.width / 2;
        this.label.y = this.slide.y - this.label.height / 2 - this.slide.height;

        this.minLabel.x = this.slide.x - this.slide.width / 2 + this.minLabel.width / 2;
        this.minLabel.y = this.slide.y - this.label.height / 2 + this.slide.height;

        this.maxLabel.x = this.slide.x + this.slide.width / 2 - 3 * this.maxLabel.width / 2;
        this.maxLabel.y = this.slide.y - this.label.height / 2 + this.slide.height;

        this.valueLabel.x = this.slide.x - this.valueLabel.width / 2;
        this.valueLabel.y = this.slide.y - this.valueLabel.height / 2 + this.slide.height;
    }
}