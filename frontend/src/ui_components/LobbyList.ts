import { Container, Graphics, Text, TextStyle, Sprite, Color } from 'pixi.js';
import { FancyButton, Button, Input } from '@pixi/ui';
import { ColorSelector } from './ColorSelector';
import { MenuContainer } from './MenuContainer';
import { SizedButton } from './SizedButton';
import { PlayerInfo } from "../game/Utils"
import server from "../server";

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
    public players: Array<PlayerInfo>;

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
            this.colorSelectors[i].onPress.connect(() => {
                if (i == this.currentPlayerNumber) {
                    this.swapColor(i);
                }
            });

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
            this.players.forEach(element => {
                if (element.name == this.playersList[this.currentPlayerNumber].label.text) {
                    element.name = this.nameInput.value;
                }
            });
            this.playersList[this.currentPlayerNumber].changeText(this.nameInput.value);
            this.nameInput.x = this.playersList[0].x - this.nameInput.width * 0.5;
            this.nameInput.y = this.playersList[this.currentPlayerNumber].y - this.nameInput.height * 0.5;

            server.updatePlayerName(this.nameInput.value);
        });
        this.nameInput.x = this.playersList[0].x - 42;
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
        let tmpIndex = -1;
        for (let i = 0; i < this.players.length; i++) {
            if (this.playersList[player].label.text == this.players[i].name) {
                tmpIndex = i;
            }
        }
        this.players[tmpIndex].color = tmp;
        if (this.players[tmpIndex].color != 4) {
            this.available[this.players[tmpIndex].color] = false;
        }

        server.updatePlayerColor(tmp);
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

        if (player.color != 4) {
            this.setPlayerColor(player, this.players.length - 1);
        }

        if (this.players.length - 1 == this.currentPlayerNumber && this.playersList[this.currentPlayerNumber].label.text == player.name) {
            this.nameInput.value = player.name;
        }

        for (let i = 0; i < 4; i++) {
            this.colorSelectors[i].y = this.playersList[i].y;
        }

        console.log(this.players);

    }

    public removePlayer(player: PlayerInfo) {
        console.log("removing: " + player.name)
        // get index of player in list
        let index = -1;
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id === player.id) {
                index = i
            }
        }
        // reutrn if player not in game
        if (index == -1) {
            return;
        }

        console.log(this.players);

        console.log(index);
        // If player is before you, then update current player
        if (this.currentPlayerNumber > index) {
            this.setCurrentPlayer(this.currentPlayerNumber - 1);
        }
        

        // update the order of the players list
        let tmp = this.players[index];
        console.log(tmp);
        for (let i = index + 1; i < this.players.length; i++) {
            this.players[i-1] = this.players[i];
            this.setPlayerColor(this.players[i-1], i-1);
            this.setPlayerName(this.players[i-1], i-1);
        }
        this.players[this.players.length - 1] = tmp;
        const emptyPlayer: PlayerInfo = {name: "", color: -1, id: ""};
        this.setPlayerColor(emptyPlayer, this.players.length - 1);
        this.setPlayerName(emptyPlayer, this.players.length - 1);

        console.log(this.players.length);
        this.colorSelectors[this.players.length - 1].reset();

        this.players.pop();
    }

    public updatePlayer(player: PlayerInfo) {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].id === player.id) {
                this.setPlayerColor(player, i);
                this.setPlayerName(player, i);
                this.players[i] = player;
            }
        }
    }

    public setCurrentPlayer(playerNum: number) {
        this.currentPlayerNumber = playerNum;
        this.nameInput.y = this.playersList[playerNum].y - 25;
    }

    public setPlayerName(player: PlayerInfo, i: number) {
        this.playersList[i].changeText(player.name);
    }

    public setPlayerColor(player: PlayerInfo, i: number) {
        this.setAvailable(this.colorSelectors[i].getColor());
        this.colorSelectors[i].setColor(player.color);
        this.setTaken(player.color);
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