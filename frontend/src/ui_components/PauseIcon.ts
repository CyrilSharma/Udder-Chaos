import { Container, Graphics } from "pixi.js";
import { Button, FancyButton } from "@pixi/ui";

export class PauseIcon extends Container {

    private left: Graphics;
    private right: Graphics;
    public myHitArea: FancyButton;

    constructor(/*x: number, y: number*/) {
        super();

        this.myHitArea = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0x0090a0, 0.1)
                        .drawRoundedRect(0, 0, 20, 20, 1)
            )).view,
            anchor: 0.5
        });

        this.left = new Graphics()
            .beginFill(0x000000)
            .drawRoundedRect(0, 0, 8, 20, 4);

        this.right = new Graphics()
            .beginFill(0x000000)
            .drawRoundedRect(0, 0, 8, 20, 4);

        this.addChild(this.myHitArea);
        this.addChild(this.left);
        this.addChild(this.right);

    }

    public resize() {

        this.myHitArea.x = 20;
        this.myHitArea.y = 20;

        this.left.x = this.myHitArea.x - 5 - this.left.width / 2;
        this.right.x = this.myHitArea.x + 5 - this.right.width / 2;

        this.left.y = this.myHitArea.y - this.left.height / 2;
        this.right.y = this.myHitArea.y - this.right.height / 2;

    }

}