import { Button, FancyButton } from '@pixi/ui';
import { Container, Graphics, Sprite, ObservablePoint } from 'pixi.js';
import { Text } from 'pixi.js';

export class BuyButton extends Container {

    private button: FancyButton;
    private posx: number;
    private posy: number;
    public dragging: boolean = false;
    private ufo: Sprite;

    constructor(posx: number, posy: number) {
        super();
        
        this.posx = posx;
        this.posy = posy;

        this.button = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xffcc66)
                        .drawCircle(40, 40, 40)
            )).view,
            pressedView: (new Button(
                new Graphics()
                        .beginFill(0xffcc66 + 0x001a4d)
                        .drawCircle(40, 40, 40)
            )).view,
            anchor: 0.5,
            text: new Text("Buy", {
                fontFamily: 'Concert One',
                align: 'center',
                fontSize: 16,
            })
        });

        this.ufo = Sprite.from('../../raw-assets/hat_duck.gif');
        this.ufo.anchor = new ObservablePoint(() => {}, null, 0.5, 0.5);
        this.ufo.y = 25;
        this.ufo.scale.x = 0.1;
        this.ufo.scale.y = 0.1;

        this.button.on('pointerdown', this.onDragStart, this);
        this.button.on('pointerup', this.onDragEnd, this);
        this.button.on('pointerupoutside', this.onDragEnd, this);

        this.addChild(this.button);
        this.addChild(this.ufo);
    }

    public getButton() {
        return this.button;
    }

    public resize(width: number, height: number) {
            
        // try and resize relative to parent
        this.button.view.width = this.button.parent.getLocalBounds().width;

        this.button.view.x = width * this.posx;
        this.button.view.y = height * this.posy;
    }

    private onDragStart() {
        console.log('down');
        this.dragging = true;
    }

    private onDragEnd() {
        console.log('up');
        this.dragging = false;
    }
}