import { io } from "socket.io-client";
import { navigation } from './utils/navigation';
import { CreateGameScreen } from './screens/CreateGameScreen';
import { GameScreen } from "./screens/GameScreen";

class Server {
    socket;

    constructor() {
        this.socket = io("http://localhost:3000");

        this.socket.on("connect", () => {
            console.log(`You connected with id: ${this.socket.id}`)
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

        this.socket.on("start-game", () => {
            navigation.showScreen(GameScreen);
            console.log("Start game!");
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
}

export default new Server();