import { Container, Graphics, Text, TextStyle, Sprite, Color } from 'pixi.js';
import { FancyButton, Button, Input } from '@pixi/ui';
import { ColorSelector } from './ColorSelector';
import { MenuContainer } from './MenuContainer';
import { SizedButton } from './SizedButton';
import { PlayerInfo } from "../game/Utils"

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

        for (let i = 0; i < 4; i++) {
            this.colorSelectors[i].y = this.playersList[i].y;
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
        for (let i = 0; i < this.players.length; i++) {
            if (i > index) {
                this.players[i-1] = this.players[i];
            }
        }
        this.players[this.players.length - 1] = tmp;

        // update UI
        this.playersList.forEach(button => {
            for (let i = 0; i < this.players.length; i++) {
                if (button.label.text == this.players[i].name) {
                    button.y = -90 + 60 * i;
                }
                if (button.label.text == this.playersList[this.currentPlayerNumber].label.text) {
                    this.nameInput.y = button.y - 25;
                }
            }
        });

        for (let i = 0; i < 4; i++) {
            this.colorSelectors[i].y = this.playersList[i].y;
        }
        
        for (let i = 0; i < 4; i++) {
            if (this.playersList[i].label.text == this.players[this.players.length - 1].name) {
                this.playersList[i].changeText("");
            }
        }

        this.players.pop();
    }

    // untested
    public setPlayers(players: PlayerInfo[]) {

        players.forEach(player => {
            if (player.color == -1) {
                player.color = 4;
            }
        });

        if (players.length > this.players.length) { // CASE 1
            // find new player and add

            for (let i = 0; i < players.length; i++) {
                let found = false;
                this.players.forEach(player => {
                    if (players[i].name == player.name) {
                        found = true;
                    }
                });
                if (!found) {
                    this.addPlayer(players[i]);
                }
            }

        } else if (players.length < this.players.length) { // CASE 2
            // remove player no longer in list

            for (let i = 0; i < this.players.length; i++) {
                let found = false;
                players.forEach(player => {
                    if (this.players[i].name == player.name) {
                        found = true;
                    }
                });
                if (!found) {
                    this.removePlayer(this.players[i]);
                    break;
                }
            }

        } else if (players.length == this.players.length) { // CASE 3
            // find changed player and update them

            let index1 = -1;
            let index2 = -1;
            for (let i = 0; i < this.players.length; i++) {
                let found = false;
                for (let j = 0; j < players.length; j++) {
                    if (this.players[i].name == players[j].name) {
                        found = true;
                    }
                }
                if (!found) {
                    index1 = i;
                }
            }
            for (let i = 0; i < players.length; i++) {
                let found = false;
                for (let j = 0; j < this.players.length; j++) {
                    if (players[i].name == this.players[j].name) {
                        found = true;
                    }
                }
                if (!found) {
                    index2 = i;
                }
            }

            if (index1 == -1 || index2 == -1) {
                return;
            }

            for (let i = 0; i < 4; i++) {
                if (this.playersList[i].getText() == this.players[index1].name) {
                    this.playersList[i].changeText(players[index2].name);
                }
            }
            this.players[index1] = players[index2];
        }

        this.players.forEach(player => {
            this.setPlayerColor(player);
        });

    }

    public setCurrentPlayer(playerNum: number) {
        this.currentPlayerNumber = playerNum;
        this.nameInput.y = this.playersList[playerNum].y - 25;
    }

    public setPlayerColor(player: PlayerInfo) {
        if (player.color == -1) {
            player.color = 4;
        }
        for (let i = 0; i < 4; i++) {
            if (this.playersList[i].getText() == player.name) {
                this.setAvailable(this.colorSelectors[i].getColor());
                this.colorSelectors[i].setColor(player.color);
                this.setTaken(player.color);
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