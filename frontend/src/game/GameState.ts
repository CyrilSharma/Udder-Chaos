import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { Piece } from './Piece';
import { Game } from './Game';
import { GameConfig, TurnType } from './Utils';

export class GameState extends Container {
    public background: Graphics;
    public game: Game;
    public color: Text;
    public turn: Text;

    // We pass the game to allow for callbacks...
    constructor(game: Game) {
        super();
        this.game = game;
        this.background = new Graphics();
        this.turn = new Text("OOWIEHRIUWEHRIF");
        this.color = new Text("IWUEFHUIWEH");
        this.addChild(this.background);
        this.addChild(this.turn);
        this.addChild(this.color);
    }

    public setup() {
        this.background.beginFill(0x964B00);
        this.background.drawRect(0, 0, this.game.board.getWidth(), 50);
        this.updateTurn(this.game.turn);
        this.turn.x = this.game.board.getWidth() / 8; 
        this.color.x = 5 * this.game.board.getWidth() / 8;
    }

    public updateTurn(turn: number) {
        this.turn.text = "Turn: " + Object.values(TurnType)[turn-1];
    }
    
    public updateColor(color_id: number) {
        let color = "";
        if (color_id == 1) color = "Red";
        else if (color_id == 2) color = "Yellow";
        else if (color_id == 3) color = "Blue";
        else if (color_id == 4) color = "Purple";
        this.color.text = "Color: " + color;
    }
}