import { Container, Sprite, ObservablePoint } from 'pixi.js';
import {  Text } from 'pixi.js';
import { Board } from './Board';
import { ColorEnum, GameConfig, COW_REGEN_RATE, COW_SACRIFICE, SCORE_GOAL, PieceEnum, DAYS_PER_ROUND } from './Utils';
import { app } from '../main';
import { CardQueue } from './CardQueue';
import { GameUpdate } from './GameUpdate';
import { GameState } from './GameState';
import { GamePanel } from '../ui_components/GamePanel';
import { PlayerColorIcon } from '../ui_components/PlayerColorIcon';
import { PlayerGameInfo } from '../ui_components/PlayerGameInfo';
import { DayCounter } from '../ui_components/DayCounter';
import { BuyButton } from '../ui_components/BuyButton';
import { ScoreCounter } from '../ui_components/ScoreCount';
import { SizedButton } from '../ui_components/SizedButton';

// This seems a little redundant right now,
// But it will house the cards as well,
// And provide some callbacks maybe.

export class Game extends Container {
    public board: Board;
    public cards: CardQueue;
    public gameState: GameState;
    public config!: GameConfig;
    public playerColor!: number;
    public updateList: GameUpdate[] = [];
    public turn: number = 1;
    public turnCount: number = 0;
    public dayCycle: number = 0;
    public totalDayCount: number = 0;
    public totalScore: number = 0;
    public leftPanel: GamePanel;
    public rightPanel: GamePanel;
    public boardPanel: GamePanel;
    public bottomPanel: GamePanel;
    private playerColorIcon: PlayerColorIcon;
    private dayCounter: DayCounter;
    private scoreCounter: ScoreCounter;
    private player1: PlayerGameInfo;
    private player2: PlayerGameInfo;
    private player3: PlayerGameInfo;
    private player4: PlayerGameInfo;
    private playerAI: PlayerGameInfo;
    public buyButton: BuyButton;
    public gameOver: boolean = false;
    public upNext: SizedButton;

    constructor() {
        super();

        this.board = new Board(this);
        this.cards = new CardQueue(this);
        this.gameState = new GameState(this);
        this.gameState.alpha = 0;
        this.buyButton = new BuyButton(0, 0);

        this.leftPanel = new GamePanel(0.1125, 0.5, 0.22, 1, 200, 1000, 0xffffff);
        this.rightPanel = new GamePanel(0.8875, 0.5, 0.22, 1, 200, 1000, 0x5f5f5f);
        this.boardPanel = new GamePanel(0.5, 0.4, 0.56, 0.6, 500, 500, 0xcc0000);
        this.bottomPanel = new GamePanel(0.5, 0.925, 0.3, 0.15, 500, 150, 0xabcdef);
        this.boardPanel.gamePanel.alpha = 0;
        this.leftPanel.gamePanel.alpha = 0;
        this.rightPanel.gamePanel.alpha = 0;
        this.bottomPanel.gamePanel.alpha = 0;
        
        this.playerColorIcon = new PlayerColorIcon(0);
        this.player1 = new PlayerGameInfo(0);
        this.player2 = new PlayerGameInfo(1);
        this.player3 = new PlayerGameInfo(2);
        this.player4 = new PlayerGameInfo(3);
        this.playerAI = new PlayerGameInfo(0);
        this.playerAI.changeText("AI")
        this.dayCounter = new DayCounter();
        this.upNext = new SizedButton(0, 0, 0.7, 0.08, "Up Next", this.leftPanel.getBox()[3] - this.leftPanel.getBox()[2], this.leftPanel.getBox()[1] - this.leftPanel.getBox()[0], 40, 0xffffff);
        this.scoreCounter = new ScoreCounter(0, 0, 0.5, 0.5, "0 of 30", this.leftPanel.width, this.leftPanel.height, 40, 0xffffff);

        this.boardPanel.addChild(this.board);
        this.leftPanel.addChild(this.playerColorIcon);
        this.leftPanel.addChild(this.player1);
        this.leftPanel.addChild(this.player2);
        this.leftPanel.addChild(this.player3);
        this.leftPanel.addChild(this.player4);
        this.leftPanel.addChild(this.dayCounter);
        this.leftPanel.addChild(this.buyButton);
        this.leftPanel.addChild(this.scoreCounter);

        this.rightPanel.addChild(this.upNext);
        this.rightPanel.addChild(this.playerAI);

        this.addChild(this.gameState);
        this.addChild(this.leftPanel);
        this.addChild(this.rightPanel);
        this.addChild(this.boardPanel);
        this.addChild(this.bottomPanel);
        this.addChild(this.cards);
    }

    public setup(config: GameConfig) {
        this.config = config;
        this.board.setup(config);
        this.cards.setup();
        //this.cards.y = this.board.getHeight();
        this.gameState.setup();
        //this.gameState.y = this.cards.y + this.cards.height;
    }

    public setPlayerColor(color: number) {
        this.playerColor = color;
        this.gameState.updateColor(color);
        this.playerColorIcon.changeColor(color);
    }

    public updateTurn() {
        if (this.gameOver) {
            return;
        }

        this.turn += 1;
        if (this.turn > 6) {
            this.turn -= 6;
            this.dayCycle++;
            if (this.dayCycle >= DAYS_PER_ROUND) {
                this.dayCycle -= DAYS_PER_ROUND;
                this.startNewRound();
            }
            this.totalDayCount++;
            this.gameState.updateDay(this.totalDayCount);
        }
        this.gameState.updateTurn(this.turn);
        this.turnCount += 1;
        this.board.spawnCows(this.turnCount);
    }

    public startNewRound() {
        console.log("New round starting!");
        
        this.cowSacrifice();
        this.board.spawnEnemies();
    }

    public cowSacrifice() {
        if (this.totalScore >= COW_SACRIFICE) {
            this.totalScore -= COW_SACRIFICE;
            this.gameState.updateScore(this.totalScore);
        }
        else {
            console.log("Failed to sacrifice enough cows!")
            this.endGame(false, "You failed to sacrifice enough cows to Homeworld.");
        }
    }

    // All the end game functionality will go here :D
    // Actually not much to do on the game side since the board is
    // reset when a new game is setup rather than when the old one finishes
    public endGame(success: boolean, message: string) {
        console.log(message);
        this.board.endGame(success, message);
        this.gameOver = true;
    }

    public ourTurn() {
        return !this.gameOver; // debug always allow current player to move
        return !this.gameOver && 
            this.playerColor == 1 && this.turn == 1 || 
            this.playerColor == 2 && this.turn == 2 || 
            this.playerColor == 3 && this.turn == 4 ||
            this.playerColor == 4 && this.turn == 5;
    }

    public scorePoints(points: number) {
        this.totalScore += points;
        this.gameState.updateScore(this.totalScore);
        if (this.totalScore >= SCORE_GOAL) {
            this.endGame(true, "You saved Homeworld with enough cows!")
        }
    }

    public resize(width: number, height: number) {
        this.leftPanel.resize(width, height);
        this.rightPanel.resize(width, height);
        this.boardPanel.resize(width, height);
        this.bottomPanel.resize(width, height);
        this.boardPanel.y = this.bottomPanel.getBox()[1] * 0.5 + (this.bottomPanel.getBox()[0] - this.bottomPanel.getBox()[1]) * 0.5;
        console.log(this.boardPanel.getBox());
        this.board.resize(this.boardPanel.getBox(), this.leftPanel.getBox()[3], this.rightPanel.getBox()[2], this.bottomPanel.getBox()[0]);

        this.playerColorIcon.y = 300;
        this.player1.y = 50;
        this.player2.y = 100;
        this.player3.y = 150;
        this.player4.y = 200;
        this.playerAI.y = 200;
        this.player1.resize(this.leftPanel.getBox()[3] - this.leftPanel.getBox()[2]);
        this.player2.resize(this.leftPanel.getBox()[3] - this.leftPanel.getBox()[2]);
        this.player3.resize(this.leftPanel.getBox()[3] - this.leftPanel.getBox()[2]);
        this.player4.resize(this.leftPanel.getBox()[3] - this.leftPanel.getBox()[2]);
        this.playerAI.resize(this.rightPanel.getBox()[3] - this.rightPanel.getBox()[2]);

        this.dayCounter.resize(this.leftPanel.getBox()[3] - this.leftPanel.getBox()[2]);
        this.dayCounter.y = -250;
        this.scoreCounter.y = -110;

        this.buyButton.y = this.scoreCounter.y + 70;
        this.cards.y = 0;
        this.cards.x = 0;
        this.upNext.y = -300;

        this.cards.placeCards();

        this.board.winScreen.resize(this.board.getWidth(), this.board.getHeight());
        this.board.loseScreen.resize(this.board.getWidth(), this.board.getHeight());
    }
}
