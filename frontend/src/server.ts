import { io } from "socket.io-client";
import { navigation } from './utils/navigation';
import { CreateGameScreen } from './screens/CreateGameScreen';
import { GameScreen } from "./screens/GameScreen";
import { HomeScreen } from "./screens/HomeScreen";
import { Player, initSeed, Position, PlayerInfo, MoveType } from "./game/Utils"
import { JoinGameScreen } from "./screens/JoinGameScreen";

class Server {
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
            console.log(this.socket.id);

            await navigation.showScreen(CreateGameScreen);
            let createGameScreen = navigation.currentScreen as CreateGameScreen;
            
            createGameScreen.addGameCode(roomCode);
            createGameScreen.getLobbyList().setCurrentPlayer(playerList.length - 1);
            playerList.forEach((player) => {
                console.log("here");
                createGameScreen.getLobbyList().addPlayer(player);
            });
        });
        
        this.socket.on("join-error", (error) => {
            let joinGameScreen = navigation.currentScreen as JoinGameScreen;
            joinGameScreen.showError(error);
        });

        this.socket.on("add-player", (playerInfo: PlayerInfo) => {
            console.log(playerInfo);
            let createGameScreen = navigation.currentScreen as CreateGameScreen;
            createGameScreen.getLobbyList().addPlayer(playerInfo);
        });

        this.socket.on("update-player-info", (playerInfo: PlayerInfo) => {
            console.log(playerInfo);
            let createGameScreen = navigation.currentScreen as CreateGameScreen;
            createGameScreen.getLobbyList().updatePlayer(playerInfo);
        })

        this.socket.on("kick-player", () => {
            this.socket.emit("leave-room");
            navigation.showScreen(HomeScreen);
        });

        this.socket.on("start-game-error", (error) => {
            console.log(error);
        });

        this.socket.on("start-game", async (seed: number, playerList: PlayerInfo[]) => {
            initSeed(seed);

            let color = 1;

            playerList.forEach((player: PlayerInfo) => {
                if (player.id == this.socket.id) {
                    color += player.color;
                }
            });

            await navigation.showScreen(GameScreen);

            let gameScreen = navigation.currentScreen as GameScreen;
            gameScreen.setPlayerColor(color);
            gameScreen.game.setPlayers(playerList);

            let cards = []
            let arrays = [
                gameScreen.game.cards.player_hand,
                gameScreen.game.cards.enemy_hand,
                gameScreen.game.cards.queue,
            ]
            for (let array of arrays) {
                for (let card of array) {
                    let dirs = []
                    for (let dir of card.dirs) {
                        dirs.push(dir)
                    }
                    cards.push(dirs)
                }
            }
            if (playerList[0].id == this.socket.id) {
                this.socket.emit("init-ai", cards);
            }
        });

        this.socket.on("share-move", (moveType, moveData, color) => {
            let gameScreen = navigation.currentScreen as GameScreen;

            gameScreen.game.moveQueue.enqueue({"moveType": moveType, "moveData": moveData, color: color});
            // switch (moveType) {
            //     case MoveType.PlayCard:
            //         gameScreen.playCard(moveData["index"], color);
            //         console.log(`Server playing card: ${moveData["index"]}, color: ${color}`);
            //         break;
            //     case MoveType.RotateCard:
            //         gameScreen.rotateCard(moveData["index"], moveData["rotation"], color);
            //         //console.log(`Server rotating card: ${moveData["index"]} ${moveData["rotation"]}, color: ${color}`);
            //         break;
            //     case MoveType.PurchaseUFO:
            //         gameScreen.purchaseUFO(moveData, color);
            //         break;
            // }
        });
    }

    public async createRoom() {
        this.socket.emit("create-room");
    }

    public async joinRoom(roomCode: string) {
        this.socket.emit("join-room", roomCode.toUpperCase());
    }
    
    public async updatePlayerName(name: string) {
        this.socket.emit("update-name", name);
    }

    public async updatePlayerColor(color: number) {
        this.socket.emit("update-color", color);
    }

    public async startGame(seed: string) {
        console.log(seed);
        if (seed === "Seed") {
            seed = "";
        }
        console.log(seed);
        this.socket.emit("start-game", seed);
    }

    public async playCard(cardIndex: number, color: number) {
        //console.log(`Sending play-card with index: ${cardIndex}`);
        this.socket.emit("make-move", MoveType.PlayCard, {"index": cardIndex}, color);
    }

    public async rotateCard(cardIndex: number, rotation: number, color: number) {
        console.log(`Sending rotate-card with index: ${cardIndex}`);
        this.socket.emit("make-move", MoveType.RotateCard, {"index": cardIndex, "rotation": rotation}, color);
    }

    public async purchaseUFO(position: Position, color: number) {
        this.socket.emit("make-move", MoveType.PurchaseUFO, position, color)
    }

    public async outOfTime() {
        this.socket.emit("out-of-time");
    }

    public async leaveRoom() {
        this.socket.emit("leave-room");
    }
}

export default new Server();