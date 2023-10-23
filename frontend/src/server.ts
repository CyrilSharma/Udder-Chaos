import { io } from "socket.io-client";
import { navigation } from './utils/navigation';
import { CreateGameScreen } from './screens/CreateGameScreen';
import { GameScreen } from "./screens/GameScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { Player, initSeed } from "./game/Utils"
//import seedrandom from 'seedrandom'
import { JoinGameScreen } from "./screens/JoinGameScreen";

class Server {
    public color!: number;
    socket;

    constructor() {
        this.socket = io(import.meta.env.VITE_SERVER_URL, { secure: false });

        this.socket.on("connect", () => {
            console.log(`You connected with id: ${this.socket.id}`);
            this.socket.emit("init-connection", true);
        });

        this.socket.on("receive-message", (msg) => {
            console.log(msg);
        });

        this.socket.on("join-error", (error) => {
            console.log(error);
        });

        this.socket.on("load-room", async (roomCode, playerList) => {
            await navigation.showScreen(CreateGameScreen);
            let createGameScreen = navigation.currentScreen as CreateGameScreen;
            createGameScreen.addGameCode(roomCode);
            createGameScreen.getPlayerList().setPlayers(playerList);
        });
        
        this.socket.on("join-error", (error) => {
            let joinGameScreen = navigation.currentScreen as JoinGameScreen;
            joinGameScreen.showError(error);
        });

        this.socket.on("player-list", (playerList) => {
            let createGameScreen = navigation.currentScreen as CreateGameScreen;
            createGameScreen.getPlayerList().setPlayers(playerList);
        });

        this.socket.on("kick-player", () => {
            this.socket.emit("leave-room");
            navigation.showScreen(HomeScreen);
        });

        this.socket.on("start-game-error", (error) => {
            console.log(error);
        });

        this.socket.on("start-game", async (seed, socketIds) => {

            // Math.seedrandom(seed);
            initSeed(seed);

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
            console.log(`Server playing card: ${cardIndex}, color: ${color}`);
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
        console.log(`Sending play-card with index: ${cardIndex}`);
        this.socket.emit("play-card", cardIndex, color);
    }

    public async leaveRoom() {
        this.socket.emit("leave-room");
    }
}

export default new Server();