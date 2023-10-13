import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import { FancyButton, Button } from '@pixi/ui';

export class PlayerListDisplay extends Container {

    public theList: Graphics;
    private players: Array<string>;
    public text: Text;

    constructor() {
        super();
        this.players = [];
        this.theList = new Graphics()
            .beginFill(0xffffff)
            .drawRoundedRect(0, 0, 300, 150, 100);
        this.addChild(this.theList);
        let style = new TextStyle({ fill: ['#000000'] });
        this.text = new Text("", style);
        this.addChild(this.text);
    }

    public addPlayer(player: string) {
        if (this.players.length >= 4) {
            return;
        }
        this.players.push(player);
        this.updateTheList();
    }

    public removePlayer(player: string) {
        this.players?.splice(this.players.indexOf(player));
        this.updateTheList();
    }

    public setPlayers(players: string[]) {
        this.players = players;
        this.updateTheList();
    }

    public numPlayers() : number {
        return this.players.length;
    }

    public updateTheList() {
        let text = "";
        this.players.forEach(element => {
            text = text + element + "\n";
        });
        console.log("text: " + text);
        this.text.text = text;
    }
}