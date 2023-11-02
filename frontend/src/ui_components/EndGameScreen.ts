import { FancyButton, Button } from '@pixi/ui';
import { Container, Text, TextStyle, Graphics, Texture, Sprite, ObservablePoint} from 'pixi.js';
import { HomeScreen } from '../screens/HomeScreen';
import { navigation } from '../utils/navigation';
import server from '../server';

export class EndGameScreen extends Container {

    private vignette: Sprite;
    private returnButton: FancyButton;
    private message: Text;

    constructor(win: boolean) {
        super();

        this.vignette = Sprite.from(Texture.WHITE);
        this.vignette.tint = 0x111111;
        this.vignette.interactive = true;
        this.vignette.alpha = 0.5;

        this.addChild(this.vignette);

        this.message = new Text(win ? "Victory!" : "Defeat.", new TextStyle({
            fontFamily: "Concert One",
            fontSize: 40,
            fill: "#ffffff",
            align: "center",
            stroke: win ? "#40cd2d" : "5c5c5c",
            lineJoin: "round",
            strokeThickness: 9
        }));
        this.message.anchor = new ObservablePoint(() => {}, null, 0.5, 0.5);
        //this.message.x = -10;
        this.addChild(this.message);

        this.returnButton = new FancyButton({
            defaultView: (new Button(
               new Graphics()
                   .beginFill(win ? 0x40cd2d : 0x5c5c5c)
                   .drawRoundedRect(0, 0, 400, 100, 15)
            )).view,
            text: new Text("Return Home", new TextStyle({
                fill: "#ffffff",
                align: "center",
                fontFamily: "Concert One",
                fontSize: 40
            })),
            anchor: 0.5,
        });
        this.returnButton.onPress.connect(() => {
            server.leaveRoom();
            this.visible = false;
            navigation.showScreen(HomeScreen);
        });
        this.addChild(this.returnButton);

    }
    
    public resize(width: number, height: number) {
        this.vignette.width = width;
        this.vignette.height = height;
        this.returnButton.x = width * 0.5;
        this.returnButton.y = height * 0.5;
        this.message.x = width * 0.5;
        this.message.y = height * 0.3;
        this.message.scale.x = 2.5;
        this.message.scale.y = 2.5;
    }


}