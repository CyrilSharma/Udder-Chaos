import { Button, FancyButton } from '@pixi/ui';
import { Container, Graphics, Sprite, ObservablePoint, FederatedPointerEvent } from 'pixi.js';
import { Text } from 'pixi.js';
import { Game } from '../game/Game';
import { PieceMap } from '../game/Utils';

export class BuyButton extends Container {
    private button: FancyButton;
    private posx: number;
    private posy: number;
    public dragging: boolean = false;
    private ufo: Sprite;
    private hoverUfo: Sprite;
    private game: Game;

    constructor(posx: number, posy: number, game: Game) {

        super();
        
        this.posx = posx;
        this.posy = posy;

        this.button = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                    .beginFill(0x5f5f5f)
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

        this.ufo = Sprite.from('../../images/black_ufo.png');
        this.ufo.anchor = new ObservablePoint(() => {}, null, 0.5, 0.5);
        this.ufo.y = 25;
        this.ufo.scale.x = 0.1;
        this.ufo.scale.y = 0.1;

        this.hoverUfo = this.initHoverUfo('../../images/black_ufo.png');

        this.button.on('pointerdown', this.onDragStart, this);
        this.button.on('globalpointermove', this.onDragMove, this);
        this.button.on('pointerup', this.onDragEnd, this);
        this.button.on('pointerupoutside', this.onDragEnd, this);

        this.game = game;

        this.addChild(this.button);
        this.addChild(this.ufo);
    }

    public getButton() {
        return this.button;
    }

    public updateButton(num: number) {
        if (num != 0) {
            this.button.defaultView = new Graphics()
                .beginFill(0xffcc66)
                .drawCircle(40, 40, 40)
        } else {
            this.button.defaultView = new Graphics()
                .beginFill(0x5f5f5f)
                .drawCircle(40, 40, 40)
        }
    }

    public resize(width: number, height: number) {
        // try and resize relative to parent
        this.button.view.width = this.button.parent.getLocalBounds().width;
        this.button.view.x = width * this.posx;
        this.button.view.y = height * this.posy;
    }

    private initHoverUfo(image: string) {
        // Create a hover ufo with new image
        let hoverUfo = Sprite.from(image);
        hoverUfo.anchor.set(0.5);
        hoverUfo.scale.x = 0.2;
        hoverUfo.scale.y = 0.2;
        hoverUfo.alpha = 0.7;
        return hoverUfo;
    }

    private onDragStart(e: FederatedPointerEvent) {
        // If player can purchase something, add hovering ufo
        if (this.game.ourTurn() && this.game.totalScore > 0) {
            this.dragging = true;

            this.hoverUfo = this.initHoverUfo("../../" + PieceMap[this.game.playerColor]);

            const localPos = this.toLocal(e.global);
            this.hoverUfo.position.set(localPos.x, localPos.y);
            this.addChild(this.hoverUfo);
        }
    }

    private onDragMove(e: FederatedPointerEvent) {
        // Move the hoverUfo around
        if (this.dragging) {
            const localPos = this.toLocal(e.global);
            this.hoverUfo.position.set(localPos.x, localPos.y);
        }
    }

    private onDragEnd() {
        this.removeChild(this.hoverUfo);
        this.dragging = false;
    }
}