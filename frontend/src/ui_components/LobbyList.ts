import { Container, Graphics, Text, TextStyle, Sprite, Color } from 'pixi.js';
import { FancyButton, Button, Input } from '@pixi/ui';
import { ColorSelector } from './ColorSelector';
import { MenuContainer } from './MenuContainer';
import { SizedButton } from './SizedButton';

type PlayerInfo = {
    name: string,
    color: number
}

export class LobbyList extends FancyButton {

    private percentX: number;
    private percentY: number;
    private percentWidth: number;
    private percentHeight: number;

    public colorSelectors: Array<ColorSelector>;
    private currentPlayerNumber: number;
    private available: Array<boolean>;
    private listContainer: SizedButton;

    private playersList: Array<SizedButton>;
    private nameInput: Input;
    //public text: Text;
    private players: Array<PlayerInfo>;

    constructor(currentPlayerNumber: number, menuContainer: MenuContainer, pX: number, pY: number, pW: number, pH: number) {
        super();
        
        /* Set up properties */
        this.percentX = pX;
        this.percentY = pY;
        this.percentWidth = pW;
        this.percentHeight = pH;

        /* Set up the background */
        this.listContainer = new SizedButton(pX, pY, pW, pH, "", menuContainer.width, menuContainer.height, 40, 0xffffff);
        this.addChild(this.listContainer);

        /* Set up the color selector */
        this.available = [true, true, true, true, true];
        this.currentPlayerNumber = currentPlayerNumber;
        this.colorSelectors = new Array<ColorSelector>;
        for (let i = 0; i < 4; i++) {
            this.colorSelectors[i] = new ColorSelector();
            this.colorSelectors[i].scale.x = 0.9;
            this.colorSelectors[i].scale.y = 0.9;
            this.colorSelectors[i].x = -215;
            this.colorSelectors[i].y = -90 + i * 60;
            this.listContainer.addChild(this.colorSelectors[i]);
        }
        this.colorSelectors[currentPlayerNumber].onPress.connect(() => {this.swapColor(this.currentPlayerNumber)});

        /* set up players */
        this.players = new Array<PlayerInfo>;
        this.playersList = new Array<SizedButton>;
        for (let i = 0; i < 4; i++) {
            if (i != this.currentPlayerNumber) {
                 this.playersList[i] = new SizedButton(0.5, 0.5, 0.8, 0.2, "", this.listContainer.width, this.listContainer.height, 10, 0xffffff);
            } else {
                this.playersList[i] = new SizedButton(0.5, 0.5, 0.8, 0.2, "", this.listContainer.width, this.listContainer.height, 10, 0xfff2b4);
            }
            this.playersList[i].x = 28;
            this.playersList[i].y = i * 60 - 90;
            this.listContainer.addChild(this.playersList[i]);
        }
        
        /* set up name input */
        this.nameInput = new Input({
            bg: this.playersList[this.currentPlayerNumber]
        });

    }

    public setTaken(color: number) {
        this.available[color] = false;
    }

    public setAvailable(color: number) {
        this.available[color] = true;
    }

    public swapColor(player: number) {
        this.available = this.colorSelectors[player].swapColor(this.available);
    }

    public addPlayer(player: PlayerInfo) {
        if (this.players.length >= 4) {
            return;
        }
        this.players.push(player);
        this.updateTheList();
    }

    public removePlayer(player: PlayerInfo) {
        this.players?.splice(this.players.indexOf(player));
        this.updateTheList();
    }

    public setPlayers(players: PlayerInfo[]) {
        this.players = players;
        this.updateTheList();
    }

    public numPlayers() : number {
        return this.players.length;
    }

    public updateTheList() {
        let text = "";

        this.players.forEach(player => {
            text = text + player.color + " : " + player.name + "\n";

        });
        console.log("text: " + text);
        //this.text.text = text;
    }

    public resize(bounds: Array<number>) {
        // Top, bottom, left, right
        this.x = bounds[2] + (bounds[3] - bounds[2]) * this.percentX;
        this.y = bounds[0] + (bounds[1] - bounds[0]) * this.percentY;
        this.width = (bounds[3] - bounds[2]) * this.percentWidth;
        this.height = (bounds[1] - bounds[0]) * this.percentHeight;
    }
}