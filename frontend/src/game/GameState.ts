import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { Piece } from './Piece';
import { Game } from './Game';
import { GameConfig, TurnType } from './Utils';

export class GameState extends Container {
    public background: Graphics;
    public game: Game;
    public color: Text;
    public turn: Text;
    public score: Text;
    public day: Text;

    // We pass the game to allow for callbacks...
    constructor(game: Game) {
        super();
        this.game = game;
        this.background = new Graphics();
        this.turn = new Text("If you are seeing this, something went wrong...");
        this.color = new Text("If you are seeing this, something went wrong...");
        this.score = new Text("0");
        this.day = new Text("Day 0");
        this.addChild(this.background);
        this.addChild(this.turn);
        this.addChild(this.color);
        this.addChild(this.score);
        this.addChild(this.day);
    }

    public setup() {
        this.background.beginFill(0x964B00);
        this.background.drawRect(0, 0, this.game.board.getWidth(), 50);
        this.updateTurn(this.game.turn);
        this.turn.x = this.game.board.getWidth() / 8; 
        this.color.x = 4 * this.game.board.getWidth() / 8;
        this.day.x = 7 * this.game.board.getWidth() / 8;
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

    public updateScore(score: number) {
        this.score.text = score;
    }

    public updateDay(day: number) {
        this.day.text = "Day " + day;
    }
}