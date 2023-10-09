import { io } from "socket.io-client";
import { navigation } from './utils/navigation';
import { CreateGameScreen } from './screens/CreateGameScreen';
import { GameScreen } from "./screens/GameScreen";

const COLOR = [
    "red",
    "yellow",
    "blue",
    "purple"
];

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

        this.socket.on("load-room", (roomCode, playerList) => {
            navigation.showScreen(CreateGameScreen)
            console.log(roomCode);
            console.log(playerList);
            // Call create game screen with roomcode
        });

        this.socket.on("player-list", (playerList) => {
            console.log(playerList);
        });

        this.socket.on("start-game-error", (error) => {
            console.log(error);
        });

        this.socket.on("start-game", (seed, socketIds) => {
            navigation.showScreen(GameScreen);
            console.log("Start game with " + seed);
            let color = socketIds.indexOf(this.socket.id);
            console.log("You are color: " + COLOR[color]);
        });
    }

    public async createRoom() {
        this.socket.emit("create-room");
    }

    public async joinRoom(roomCode: string) {
        this.socket.emit("join-room", roomCode);
    }

    public async startGame() {
        this.socket.emit("start-game");
    }
}

export default new Server();