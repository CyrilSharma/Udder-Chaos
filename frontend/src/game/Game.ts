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
import { PauseIcon } from '../ui_components/PauseIcon';
import { PauseMenu } from '../ui_components/PauseMenu';

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
    public timeout: boolean = false;
    public gameSettings: GameSettings = gameSettings;
    public moveQueue: MoveQueue;
    public leftPanel: GamePanel;
    public rightPanel: GamePanel;
    public boardPanel: GamePanel;
    public bottomPanel: GamePanel;
    private playerColorIcon!: PlayerColorIcon;
    private dayCounter: DayCounter;
    private scoreCounter: ScoreCounter;
    public buyButton: BuyButton;
    public gameOver: boolean = false;
    public animating: boolean = false;
    public upNext: SizedButton;
    public codeDisplay: SizedButton;
    public pauseButton: PauseIcon;
    public pauseMenu: PauseMenu;
    public players: PlayerGameInfo[] = [];
    public AI: PlayerGameInfo;

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

        for (let i = 0; i < 4; i++) {
            this.players[i] = new PlayerGameInfo(i);
        }
        this.AI = new PlayerGameInfo(-1);
        this.players[0].toggleTimer(true);

        this.AI.setName("AI")
        this.dayCounter = new DayCounter(
            this.gameSettings.getValue("days_per_round"),
            this.gameSettings.getValue("cow_regen_rate")
        );
        this.upNext = new SizedButton(
            0, 0, 0.7, 0.08, "Up Next",
            this.leftPanel.getBox()[3] - this.leftPanel.getBox()[2],
            this.leftPanel.getBox()[1] - this.leftPanel.getBox()[0],
            40, 0xffffff
        );

        this.scoreCounter = new ScoreCounter(
            0, 0, 0.5, 0.5,
            `0 of ${this.gameSettings.getValue('score_goal')}`,
            this.leftPanel.width, this.leftPanel.height,
            40, 0xffffff, this.gameSettings.getValue('score_goal')
        );
        this.codeDisplay = new SizedButton(
            0, 0, 0.92, 0.04, "Code:\nABCD",
            this.rightPanel.width, this.rightPanel.height,
            15, 0xffcc66
        );
        this.codeDisplay.changeText("Code:\nCODE");
        this.rightPanel.addChild(this.codeDisplay);

        this.boardPanel.addChild(this.board);
        for (let i = 0; i < 4; i++) {
            this.leftPanel.addChild(this.players[i]);
        }
        this.leftPanel.addChild(this.dayCounter);
        this.leftPanel.addChild(this.buyButton);
        this.leftPanel.addChild(this.scoreCounter);

        this.rightPanel.addChild(this.upNext);
        this.rightPanel.addChild(this.AI);

        this.addChild(this.boardPanel);
        this.addChild(this.leftPanel);
        this.addChild(this.rightPanel);
        this.addChild(this.bottomPanel);
        this.addChild(this.cards);

        this.pauseButton = new PauseIcon();
        this.addChild(this.pauseButton);

        this.pauseMenu = new PauseMenu();
        this.pauseButton.myHitArea.onPress.connect(() => {
            this.pauseMenu.visible = true;
        });
        this.addChild(this.pauseMenu);
        this.resize(window.innerWidth, window.innerHeight);

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

    public setPlayerName(name: string, index: number) {
        if (index < 1 || index > 4) throw new Error("Invalid index in set player name");
        this.players[index - 1].setName(name);
    }

    public setRoomCode(code: string) {
        this.codeDisplay.changeText("Code:\n" + code);
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

        let idxs = [0, 1, 4, 2, 3, 4];
        let idx = idxs[(6 + this.turn - 1) % 6];
        if (idx == 4) {
            this.AI.addShadow();
            this.AI.toggleTimer(true);
        } else {
            this.players[idx].addShadow();
            this.players[idx].toggleTimer(true);
        }

        let pidx = idxs[(6 + this.turn - 2) % 6];
        if (pidx == 4) {
            this.AI.removeShadow();
            this.AI.toggleTimer(false);
        } else {
            this.players[pidx].removeShadow();
            this.players[pidx].toggleTimer(false);
        }

        this.turnCount += 1;
        this.timer = this.gameSettings.getValue("timer_length");
        this.timeout = false;
        this.updatePlayerInfoTimers();
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
        // return !this.gameOver && !this.animating; // debug always allow current player to move
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
            this.timer = Math.max(this.timer - 1, 0);
            //Update the timer here
            console.log("current time: " + this.timer);
            // if (this.timer <= 0) {
            if (this.timer <= 0 && this.ourTurn()) {
                this.timeout = true;
                server.outOfTime();
            }
            this.updatePlayerInfoTimers();
        }
    }

    public updatePlayerInfoTimers() {
        let timelen =  this.gameSettings.getValue("timer_length");
        for (let i = 0; i < 4; i++) {
            this.players[i].updateTimer(this.timer, timelen);
        }
        this.AI.updateTimer(this.timer, timelen);
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
        this.boardPanel.y = this.bottomPanel.getBox()[1] * 0.5
            + (this.bottomPanel.getBox()[0] - this.bottomPanel.getBox()[1]) * 0.5;
        this.board.resize(
            this.boardPanel.getBox(),
            this.leftPanel.getBox()[3],
            this.rightPanel.getBox()[2],
            this.bottomPanel.getBox()[0]
        );

        if (this.playerColorIcon) {
            this.playerColorIcon.y = 300;
        }

        for (let i = 0; i < 4; i++) {
            this.players[i].y = 50 + 50 * i;
        }
        this.AI.y = 250;
        
        let labelsize = this.leftPanel.getBox()[3] - this.leftPanel.getBox()[2];
        for (let i = 0; i < 4; i++) {
            this.players[i].resize(labelsize);
        }
        this.AI.resize(labelsize);
        // this.players[0].addShadow();

        this.dayCounter.resize(this.leftPanel.getBox()[3] - this.leftPanel.getBox()[2]);
        this.dayCounter.y = -250;
        this.scoreCounter.y = -110;

        this.buyButton.y = this.scoreCounter.y + 70;
        this.cards.y = 0;
        this.cards.x = 0;
        this.upNext.y = this.rightPanel.height * -0.5 + 0.5 * this.upNext.height
        this.codeDisplay.y = 200;
        this.pauseButton.resize();
        this.pauseMenu.resize(width, height);

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
