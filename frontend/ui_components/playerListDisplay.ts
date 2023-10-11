import { Container, Graphics } from 'pixi.js';
import { FancyButton, Button } from '@pixi/ui';

export class PlayerListDisplay extends Container {

    public theList: FancyButton;
    private players: Array<string>;
    private theText: string;

    constructor() {
        super();
        this.players = [];
        this.theText = "";

        this.theList = new FancyButton({
            defaultView: (new Button(
                new Graphics()
                        .beginFill(0xffffff, 1)
                        .drawRect(0, 0, 300, 600)
            )).view,
            text: "",
            anchor: 0.5,
        });
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

    public textify(players: Array<string>) {
        let text:string;
        text = "";
        players.forEach(element => {
            text = text + element + "\n";
        });
        this.theText = text;
    }

    public numPlayers() : number {
        return this.players.length;
    }

    updateTheList() {
        this.textify(this.players);
        this.theList.text = this.theText;
    }

}