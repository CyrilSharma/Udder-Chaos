import { io } from "socket.io-client";
import { navigation } from './utils/navigation';
import { CreateGameScreen } from './screens/CreateGameScreen';
import { GameScreen } from "./screens/GameScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { PlayerInfo, initSeed } from "./game/Utils"
import { Player, Position } from "./game/Utils"
//import seedrandom from 'seedrandom'
import { JoinGameScreen } from "./screens/JoinGameScreen";

const MoveType = {
    PlayCard: 0,
    RotateCard: 1,
    PurchaseUFO: 2,
}

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

        this.socket.on("load-room", async (roomCode, playerList: PlayerInfo[]) => {
            console.log("hi");
            console.log(playerList);

            await navigation.showScreen(CreateGameScreen);
            let createGameScreen = navigation.currentScreen as CreateGameScreen;
            
            createGameScreen.addGameCode(roomCode);
            createGameScreen.getLobbyList().setCurrentPlayer(playerList.length - 1);
            createGameScreen.getLobbyList().setPlayers(playerList);
        });
        
        this.socket.on("join-error", (error) => {
            let joinGameScreen = navigation.currentScreen as JoinGameScreen;
            joinGameScreen.showError(error);
        });

        this.socket.on("player-list", (playerlist) => {
            let createGameScreen = navigation.currentScreen as CreateGameScreen;
            createGameScreen.getLobbyList().setPlayers(playerlist);
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

            await navigation.showScreen(GameScreen);

            let gameScreen = navigation.currentScreen as GameScreen;
            gameScreen.setPlayerColor(color - 1);

            this.color = color;
        });

        this.socket.on("share-move", (moveType, moveData, color) => {
            let gameScreen = navigation.currentScreen as GameScreen;
            
            switch (moveType) {
                case MoveType.PlayCard:
                    gameScreen.playCard(moveData["index"], color);
                    //console.log(`Server playing card: ${moveData["index"]}, color: ${color}`);
                    break;
                case MoveType.RotateCard:
                    gameScreen.rotateCard(moveData["index"], moveData["rotation"], color);
                    //console.log(`Server rotating card: ${moveData["index"]} ${moveData["rotation"]}, color: ${color}`);
                    break;
                case MoveType.PurchaseUFO:
                    gameScreen.purchaseUFO(moveData, color);
                    break;
            }
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
        //console.log(`Sending play-card with index: ${cardIndex}`);
        this.socket.emit("make-move", MoveType.PlayCard, {"index": cardIndex}, color);
    }

    public async rotateCard(cardIndex: number, rotation: number, color: number) {
        //console.log(`Sending rotate-card with index: ${cardIndex}`);
        this.socket.emit("make-move", MoveType.RotateCard, {"index": cardIndex, "rotation": rotation}, color);
    }

    public async purchaseUFO(position: Position, color: number) {
        this.socket.emit("make-move", MoveType.PurchaseUFO, position, color)
    }


    public async leaveRoom() {
        this.socket.emit("leave-room");
    }
}

export default new Server();