import { io } from "socket.io-client";
import { navigation } from './utils/navigation';
import { CreateGameScreen } from './screens/CreateGameScreen';
import { GameScreen } from "./screens/GameScreen";
import { Player } from "./game/Utils"
import seedrandom from 'seedrandom'

class Server {
    public color!: number;
    socket;

    constructor() {
        this.socket = io("http://localhost:3000");

        this.socket.on("connect", () => {
            console.log(`You connected with id: ${this.socket.id}`);
            this.socket.emit("init-connection", true);
        });

        this.socket.on("receive-message", (msg) => {
            console.log(msg);
        });

        this.socket.on("load-room", async (roomCode, playerList) => {
            await navigation.showScreen(CreateGameScreen);
            let createGameScreen = navigation.currentScreen as CreateGameScreen;
            createGameScreen.addGameCode(roomCode);
            createGameScreen.getPlayerList().setPlayers(playerList);
        });

        this.socket.on("player-list", (playerList) => {
            let createGameScreen = navigation.currentScreen as CreateGameScreen;
            createGameScreen.getPlayerList().setPlayers(playerList);
        });

        this.socket.on("start-game-error", (error) => {
            console.log(error);
        });

        this.socket.on("start-game", async (seed, socketIds) => {
            seedrandom(seed);
            let color = socketIds.indexOf(this.socket.id) + 1;
            console.log("You are color: " + color);

            await navigation.showScreen(GameScreen);

            let gameScreen = navigation.currentScreen as GameScreen;
            gameScreen.setPlayerColor(color);

            this.color = color;
        });

        this.socket.on("share-move", (cardIndex, color) => {
            let gameScreen = navigation.currentScreen as GameScreen;
            gameScreen.playCard(cardIndex, color);
            console.log("Server playing card " + cardIndex);
        });
    }

    public async createRoom() {
        this.socket.emit("create-room");
    }

    public async joinRoom(roomCode: string) {
        this.socket.emit("join-room", roomCode.toUpperCase());
    }

    public async startGame() {
        this.socket.emit("start-game");
    }

    public async playCard(cardIndex: number, color: number) {
        this.socket.emit("play-card", cardIndex, color);
    }

    public async leaveRoom() {
        this.socket.emit("leave-room");
    }
}

export default new Server();