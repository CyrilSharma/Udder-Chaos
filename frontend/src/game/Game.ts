import { Container, Sprite, ObservablePoint, Text } from 'pixi.js';
import { Board } from './Board';
import { ColorEnum, GameConfig, PieceEnum, PlayerInfo, defaultGameSettings } from './Utils';
import { app } from '../main';
import { CardQueue } from './CardQueue';
import { GameUpdate } from './GameUpdate';
import { GamePanel } from '../ui_components/GamePanel';
import { PlayerColorIcon } from '../ui_components/PlayerColorIcon';
import { PlayerGameInfo } from '../ui_components/PlayerGameInfo';
import { DayCounter } from '../ui_components/DayCounter';
import { BuyButton } from '../ui_components/BuyButton';
import { ScoreCounter } from '../ui_components/ScoreCount';
import { SizedButton } from '../ui_components/SizedButton';
import server from "../server";
import { GameSettings, gameSettings } from "./GameSettings";
import { MoveQueue } from './MoveQueue';
import { SoundHandler } from './SoundHandler';

// This seems a little redundant right now,
// But it will house the cards as well,
// And provide some callbacks maybe.

export class Game extends Container {
    public board: Board;
    public cards: CardQueue;
    public config!: GameConfig;
    public playerColor!: number;
    public updateList: GameUpdate[] = [];
    public turn: number = 1;
    public turnCount: number = 0;
    public dayCycle: number = 0;
    public totalDayCount: number = 0;
    public totalScore: number = 0;
    private timer: number = 0;
    private timerInterval: NodeJS.Timeout;
    public gameSettings: GameSettings = gameSettings;
    public moveQueue: MoveQueue;
    public leftPanel: GamePanel;
    public rightPanel: GamePanel;
    public boardPanel: GamePanel;
    public bottomPanel: GamePanel;
    private playerColorIcon!: PlayerColorIcon;
    private dayCounter: DayCounter;
    private scoreCounter: ScoreCounter;
    public player1: PlayerGameInfo;         // This is not great, need to change this @Ethan
    public player2: PlayerGameInfo;
    public player3: PlayerGameInfo;
    public player4: PlayerGameInfo;
    public playerAI: PlayerGameInfo;
    public buyButton: BuyButton;
    public gameOver: boolean = false;
    public animating: boolean = false;
    public upNext: SizedButton;
    public codeDisplay: SizedButton;

    constructor() {
        super();

        this.board = new Board(this);
        this.cards = new CardQueue(this);
        this.buyButton = new BuyButton(0, 0, this);
        this.timer = this.gameSettings.getValue("timer_length");
        this.timerInterval = this.initTimer();
        this.moveQueue = new MoveQueue(this);

        this.startBGM();

        this.leftPanel = new GamePanel(0.11275, 0.5, 0.2, 1, 200, 1000, 0xffffff);
        this.rightPanel = new GamePanel(0.88725, 0.5, 0.2, 1, 200, 1000, 0x5f5f5f);
        this.boardPanel = new GamePanel(0.5, 0.4, 0.56, 0.6, 500, 500, 0xcc0000);
        this.bottomPanel = new GamePanel(0.5, 0.925, 0.3, 0.15, 500, 150, 0xabcdef);
        this.boardPanel.gamePanel.alpha = 0;
        this.leftPanel.gamePanel.alpha = 0;
        this.rightPanel.gamePanel.alpha = 0;
        this.bottomPanel.gamePanel.alpha = 0;

        this.player1 = new PlayerGameInfo(0);
        this.player2 = new PlayerGameInfo(1);
        this.player3 = new PlayerGameInfo(2);
        this.player4 = new PlayerGameInfo(3);
        this.playerAI = new PlayerGameInfo(-1);

        this.player1.toggleTimer(true);

        this.playerAI.changeText("AI")
        this.dayCounter = new DayCounter(7);
        this.upNext = new SizedButton(0, 0, 0.7, 0.08, "Up Next", this.leftPanel.getBox()[3] - this.leftPanel.getBox()[2], this.leftPanel.getBox()[1] - this.leftPanel.getBox()[0], 40, 0xffffff);

        this.scoreCounter = new ScoreCounter(0, 0, 0.5, 0.5, `0 of ${this.gameSettings.getValue('score_goal')}`, this.leftPanel.width, this.leftPanel.height, 40, 0xffffff);
        this.codeDisplay = new SizedButton(0, 0, 0.92, 0.04, "Code:\nABCD", this.rightPanel.width, this.rightPanel.height, 15, 0xffcc66);
        this.codeDisplay.changeText("Code:\nCODE");
        this.rightPanel.addChild(this.codeDisplay);


        this.boardPanel.addChild(this.board);
        this.leftPanel.addChild(this.player1);
        this.leftPanel.addChild(this.player2);
        this.leftPanel.addChild(this.player3);
        this.leftPanel.addChild(this.player4);
        this.leftPanel.addChild(this.dayCounter);
        this.leftPanel.addChild(this.buyButton);
        this.leftPanel.addChild(this.scoreCounter);

        this.rightPanel.addChild(this.upNext);
        this.rightPanel.addChild(this.playerAI);

        this.addChild(this.boardPanel);
        this.addChild(this.leftPanel);
        this.addChild(this.rightPanel);
        this.addChild(this.bottomPanel);
        this.addChild(this.cards);

    }
    
    public setup(config: GameConfig) {
        this.config = config;
        this.board.setup(config);
        this.cards.setup();
    }

    public setPlayerColor(color: number) {
        this.playerColor = color;
        this.playerColorIcon = new PlayerColorIcon(color - 1);
        this.leftPanel.addChild(this.playerColorIcon);
        this.playerColorIcon.changeColor(color - 1);
    }

    public updateTurn() {
        if (this.gameOver) {
            return;
        }

        this.turn += 1;
        if (this.turn > 6) {
            this.turn -= 6;
            this.dayCycle++;
            this.dayCounter.cycleDay(this.dayCounter);
            if (this.dayCycle >= this.gameSettings.getValue("days_per_round")) {
                this.dayCycle -= this.gameSettings.getValue("days_per_round");
                this.startNewRound();
            }
            this.totalDayCount++;
        }
        switch (this.turn) {
            case 1:
                this.playerAI.removeShadow();
                this.playerAI.toggleTimer(false);
                this.player1.addShadow();
                this.player1.toggleTimer(true);
                break;
            case 2:
                this.player1.removeShadow();
                this.player1.toggleTimer(false);
                this.player2.addShadow();
                this.player2.toggleTimer(true);
                break;
            case 3:
                this.player2.removeShadow();
                this.player2.toggleTimer(false);
                this.playerAI.addShadow();
                this.playerAI.toggleTimer(true);
                break;
            case 4:
                this.playerAI.removeShadow();
                this.playerAI.toggleTimer(false);
                this.player3.addShadow();
                this.player3.toggleTimer(true);
                break;
            case 5:
                this.player3.removeShadow();
                this.player3.toggleTimer(false);
                this.player4.addShadow();
                this.player4.toggleTimer(true);
                break;
            case 6:
                this.player4.removeShadow();
                this.player4.toggleTimer(false);
                this.playerAI.addShadow();
                this.playerAI.toggleTimer(true);
                break;
        }
        this.turnCount += 1;
        this.timer = this.gameSettings.getValue("timer_length");
        console.log("TIMER IS " + this.timer);
        this.board.spawnCows(this.turnCount);
    }

    public startNewRound() {
        console.log("New round starting!");
        
        this.cowSacrifice();
        this.board.spawnEnemies();
    }

    public cowSacrifice() {
        if (this.totalScore >= this.gameSettings.getValue("cow_sacrifice")) {
            this.scorePoints(-this.gameSettings.getValue("cow_sacrifice"));
        }
        else {
            this.scorePoints(-this.totalScore);
            console.log("Failed to sacrifice enough cows!");
            this.endGame(false, "You failed to sacrifice enough cows to Homeworld.");
        }
    }

    // All the end game functionality will go here :D
    // Actually not much to do on the game side since the board is
    // reset when a new game is setup rather than when the old one finishes
    public endGame(success: boolean, message: string) {
        //console.log(message);
        this.stopBGM();
        this.board.endGame(success, message);
        this.gameOver = true;
        clearInterval(this.timerInterval);
    }

    public ourTurn() {
        return !this.gameOver && !this.animating; // debug always allow current player to move
        return !this.gameOver && !this.animating &&
            this.playerColor == 1 && this.turn == 1 || 
            this.playerColor == 2 && this.turn == 2 || 
            this.playerColor == 3 && this.turn == 4 ||
            this.playerColor == 4 && this.turn == 5;
    }

    public initTimer() {
        let self = this;
        return setInterval(function() {self.updateTimer()}, 1000);
    }

    public updateTimer() {
        if (!this.animating) {
            this.timer -= 1;
            //Update the timer here
            console.log("current time: " + this.timer);
            // if (this.timer <= 0) {
            if (this.timer <= 0 && this.ourTurn()) {
                console.log("out of time");
                server.outOfTime();
            }
            this.updatePlayerInfoTimers();
        }
    }

    public updatePlayerInfoTimers() {
        this.player1.updateTimer(this.timer, defaultGameSettings.timer_length);
        this.player2.updateTimer(this.timer, defaultGameSettings.timer_length);
        this.player3.updateTimer(this.timer, defaultGameSettings.timer_length);
        this.player4.updateTimer(this.timer, defaultGameSettings.timer_length);
        this.playerAI.updateTimer(this.timer, defaultGameSettings.timer_length);
    }

    public scorePoints(points: number) {
        this.totalScore += points;
        if (this.totalScore >= this.gameSettings.getValue("score_goal")) {
            this.endGame(true, "You saved Homeworld with enough cows!")
        }
        this.scoreCounter.updateScore(this.totalScore.toString() + " ");
        this.buyButton.updateButton(this.totalScore);
    }

    public resize(width: number, height: number) {
        this.leftPanel.resize(width, height);
        this.rightPanel.resize(width, height);
        this.boardPanel.resize(width, height);
        this.bottomPanel.resize(width, height);
        this.boardPanel.y = this.bottomPanel.getBox()[1] * 0.5 + (this.bottomPanel.getBox()[0] - this.bottomPanel.getBox()[1]) * 0.5;
        this.board.resize(this.boardPanel.getBox(), this.leftPanel.getBox()[3], this.rightPanel.getBox()[2], this.bottomPanel.getBox()[0]);

        if (this.playerColorIcon) {
            this.playerColorIcon.y = 300;
        }
        this.player1.y = 50;
        this.player2.y = 100;
        this.player3.y = 150;
        this.player4.y = 200;
        this.playerAI.y = 250;
        this.player1.resize(this.leftPanel.getBox()[3] - this.leftPanel.getBox()[2]);
        this.player2.resize(this.leftPanel.getBox()[3] - this.leftPanel.getBox()[2]);
        this.player3.resize(this.leftPanel.getBox()[3] - this.leftPanel.getBox()[2]);
        this.player4.resize(this.leftPanel.getBox()[3] - this.leftPanel.getBox()[2]);
        this.player1.addShadow();
        this.playerAI.resize(this.rightPanel.getBox()[3] - this.rightPanel.getBox()[2]);

        this.dayCounter.resize(this.leftPanel.getBox()[3] - this.leftPanel.getBox()[2]);
        this.dayCounter.y = -250;
        this.scoreCounter.y = -110;

        this.buyButton.y = this.scoreCounter.y + 70;
        this.cards.y = 0;
        this.cards.x = 0;
        this.upNext.y = -310;
        this.codeDisplay.y = 200;

        this.cards.placeCards(false);

        this.board.winScreen.resize(this.board.getWidth(), this.board.getHeight());
        this.board.loseScreen.resize(this.board.getWidth(), this.board.getHeight());

    }

    private startBGM() {
        SoundHandler.playBGM("game-music.mp3");
    }

    private stopBGM() {
        SoundHandler.stopBGM();
    }
}
