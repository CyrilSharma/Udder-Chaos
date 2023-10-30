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
            this.colorSelectors[i].onPress.connect(() => {if (i == this.currentPlayerNumber) {
                this.swapColor(i);
            }});

        }

        /* set up players */
        this.players = new Array<PlayerInfo>;
        this.playersList = new Array<SizedButton>;
        for (let i = 0; i < 4; i++) {
            if (i != this.currentPlayerNumber) {
                 this.playersList[i] = new SizedButton(0.5, 0.5, 0.8, 0.2, "        ", this.listContainer.width, this.listContainer.height, 40, 0xffffff);
            } else {
                this.playersList[i] = new SizedButton(0.5, 0.5, 0.8, 0.2, "        ", this.listContainer.width, this.listContainer.height, 40, 0xfff2b4);
            }
            this.playersList[i].x = 28;
            this.playersList[i].y = i * 60 - 90;
            this.listContainer.addChild(this.playersList[i]);
        }
        
        /* set up name input */
        this.nameInput = new Input({
            bg: this.playersList[this.currentPlayerNumber],
            maxLength: 10,
            textStyle: new TextStyle({
                fontFamily: "Concert One",
                fontSize: 40,
                fill: "#000000",
                align: "center",
            })
        });
        this.nameInput.alpha = 1;
        this.nameInput.value = this.playersList[this.currentPlayerNumber].label.text;
        console.log(`Value = ${this.nameInput.value}`)
        //this.nameInput.onChange();
        this.listContainer.addChild(this.nameInput);
        // Room Code Input
        // this.roomCodeInput = new Input({
        //     bg: new Graphics()
        //         .beginFill(0xffffff)
        //         .drawRect(0, 0, 300, 150),
        //     placeholder: "Enter Room Code",
        //     padding: 0
        // });

    }

    public setTaken(color: number) {
        this.available[color] = false;
    }

    public setAvailable(color: number) {
        this.available[color] = true;
    }

    public swapColor(player: number) {
        let tmp = this.colorSelectors[player].swapColor(this.available);
        this.players[player].color = tmp;
        if (this.players[player].color != 4) {
            this.available[this.players[player].color] = false;
        }
        console.log(this);
    }

    public addPlayer(player: PlayerInfo) {

        console.log(this.players.length)
        if (this.players.length >= 4) {
            return;
        }
        this.players.push(player);
        this.players.forEach(element => {
            console.log(element);
        });
        console.log(`Length: ${this.players.length}`);
        this.playersList[this.players.length - 1].changeText(player.name);
    }

    public removePlayer(player: PlayerInfo) {

        // get index of player in list
        let index = -1;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].name == player.name) {
                index = i;
            }
        }

        // update the UI
        let tmp = this.playersList[index];
        this.playersList[index].y = -90 + 60 * 3;
        for (let i = 0; i < 4; i++) {
            if (i > index) {
                this.playersList[i].y -= 60;
                this.playersList[i] = this.playersList[i - 1];
            }
        }
        this.playersList[3] = tmp;

        // remove player from list
        this.players.splice(index, 1);

        // update available colors
        if (index < this.currentPlayerNumber) {
            this.currentPlayerNumber--;
        }
        this.available[this.colorSelectors[this.players.length].reset()] = true;
    }

    // untested
    public setPlayers(players: PlayerInfo[]) {
        this.players = players;
        for (let i = 0; i < 4; i++) {
            if (players[i] != null) {
                this.playersList[i].changeText(players[i].name);
            } else {
                this.playersList[i].changeText("");
            }
        }
    }

    // untested
    public numPlayers() : number {
        return this.players.length;
    }

    public resize(bounds: Array<number>) {
        // Top, bottom, left, right
        this.x = bounds[2] + (bounds[3] - bounds[2]) * this.percentX;
        this.y = bounds[0] + (bounds[1] - bounds[0]) * this.percentY;
        this.width = (bounds[3] - bounds[2]) * this.percentWidth;
        this.height = (bounds[1] - bounds[0]) * this.percentHeight;
    }
}