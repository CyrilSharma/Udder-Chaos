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
            this.playersList[i].label.text = "";
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
        this.nameInput.alpha = 0;
        this.nameInput.value = this.playersList[this.currentPlayerNumber].label.text;
        this.nameInput.onChange.connect(() => {
            if (this.nameInput.value.length > 10) {
                this.nameInput.value = this.nameInput.value.slice(0, 10);
            }
            this.playersList[this.currentPlayerNumber].changeText(this.nameInput.value);
            this.nameInput.x = this.playersList[0].x - this.nameInput.width * 0.5;
            this.nameInput.y = this.playersList[this.currentPlayerNumber].y - this.nameInput.height * 0.5;
        });
        this.nameInput.x = this.playersList[0].x - 42;
        //this.nameInput.y = this.playersList[0].y;

        this.listContainer.addChild(this.nameInput);
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
    }

    public addPlayer(player: PlayerInfo) {

        if (this.players.length >= 4) {
            return;
        }
        this.players.push(player);
        
        for (let i = 0; i < 4; i++) {
            if (this.playersList[i].label.text == "") {
                this.playersList[i].changeText(player.name);
                break;
            }
        }

        if (this.players.length - 1 == this.currentPlayerNumber && this.playersList[this.currentPlayerNumber].label.text == player.name) {
            this.nameInput.value = player.name;
        }

    }

    public removePlayer(player: PlayerInfo) {

        // get index of player in list
        let index = -1;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].name == player.name) {
                index = i;
            }
        }

        // reutrn if player not in game
        if (index == -1) {
            return;
        }

        // update the order of the players list
        let tmp = this.players[index];
        for (let i = 0; i < 4; i++) {
            if (i > index) {
                this.players[i-1] = this.players[i];
            }
        }
        this.players[3] = tmp;

        // update UI
        this.playersList.forEach(button => {
            for (let i = 0; i < 4; i++) {
                if (button.label.text == this.players[i].name) {
                    button.y = -90 + 60 * i;
                }
                if (button.label.text == this.playersList[this.currentPlayerNumber].label.text) {
                    this.nameInput.y = button.y - 25;
                }
            }
        });
        
        for (let i = 0; i < 4; i++) {
            if (this.playersList[i].label.text == this.players[3].name) {
                this.playersList[i].changeText("");
            }
        }

        //this.playersList[3].changeText("");
        this.players.pop();
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