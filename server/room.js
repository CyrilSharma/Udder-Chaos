import { removeRoom, initPlayer, ai_socket } from "./server.js"

const TEAM = {
    ALIEN: true,
    HUMAN: false,
}

const COLOR = {
    RED: 0,
    YELLOW: 1,
    BLUE: 2,
    PURPLE: 3,
    UNSET: 4  
}


// 4 represents AI, all 0-3 are player colors
const PLAYER_ORDER = [0,1,4]
//const PLAYER_ORDER = [0,1,4,2,3,4]

const MAX_PLAYERS = 1;


const HAND_SIZE = 3;

/*
 * Room class tracks all players within a room/game and related game information.
 * Contains functions for adding players to the room and starting the game.
 */
export class Room {
    constructor(io, roomCode) {
        this.io = io;
        this.roomCode = roomCode;
        this.players = [];
        this.moveList = [];
        this.gameSettings = {};
        this.inGame = false;
    }

    addNewPlayer(socket, savedID, host=false) {
        if (!this.inGame) {
            // If in the lobby, add a new player if space
            if (this.players.length >= MAX_PLAYERS) {
                socket.emit("join-error", "This room is full!");
                console.log(socket.id + " couldn't join room: " + this.roomCode);
                return;
            }
            let player = new Player(socket, TEAM.ALIEN, this, host);
            this.players.push(player);

            player.joinRoom();
            socket.to(this.roomCode).emit("add-player", player.getPlayerInfo());
            console.log(socket.id + " joined the room: " + this.roomCode);
        }
        else {
            console.log(savedID)
            let player = null;
            for (let i = 0; i < this.players.length; i++) {
                if (this.players[i].id === savedID) {
                    player = this.players[i];
                }
            }
            
            if (player == null) {
                socket.emit("join-error", "This game is in progress!");
                return;
            }
            console.log("Reconnect!" + player);
            player.reconnectPlayer(socket);
            socket.emit('start-game', this.gameSettings, this.getPlayerInfo());
            socket.emit('share-move-list', this.moveList);
        }
    }

    removePlayer(player) {
        // Loop through players to find the correct player to remove
        player.socket.leave(this.roomCode);

        let i = this.players.indexOf(player);
        this.players.splice(i, 1);
        //console.log("new list" + this.getPlayerNames());

        if (this.players.length > 0) {
            // There are still players in the game
            //this.updatePlayerList(this.io);
        }
        else {
            removeRoom(this.roomCode);
        }
    }

    checkOnlinePlayers() {
        for (let i = 0; i < this.players.length; i++) {
            if (this.players[i].socket != null) {
                return true;
            }
        }
        return false;
    }

    updatePlayer(player) {
        player.socket.to(this.roomCode).emit("update-player-info", player.getPlayerInfo());
    }

    getPlayerInfo() {
        let playerList = [];
        for (let player of this.players) {
            playerList.push(player.getPlayerInfo());
        }
        return playerList;
    }

    getPlayerIds() {
        let ids = []
        for (let index in this.players) {
            ids.push(this.players[index].socket.id)
        }
        ids.push("AI-player")
        return ids;
    }

    setSettings(gameSettings) {
        let seed = gameSettings.seed === "" ? gameSettings.seed : this.roomCode;
        let numSeed = 0;

        for (let i = 0; i < seed.length; i++) {
            numSeed += seed.charCodeAt(i);
        }

        gameSettings.seed = numSeed;
        this.gameSettings = gameSettings;
    }

    startGame(host) {
        if (this.players.length == MAX_PLAYERS) {
            for (let i = 0; i < MAX_PLAYERS; i++) {
                if (this.players[i].color == 4) {
                    // If any player is unset color, stop with error.
                    host.emit("start-game-error", "Everyone must choose a color!");
                    return;
                }
            }
            this.io.to(this.roomCode).emit('start-game', this.gameSettings, this.getPlayerInfo());
            this.inGame = true;
        }
        else {
            host.emit("start-game-error", "Not enough players to start the game!");
        }
    }

    // Emit move to all players
    makeMove(socket, moveType, moveData, color) {
        console.log("moving now")
        this.moveList.push({"moveType": moveType, "moveData": moveData, "color": color, "animated": false});

        // If emmiter is offline, can broadcast to whole room
        if (socket == null) {
            socket = this.io;
        }
        socket.to(this.roomCode).emit("share-move", moveType, moveData, color);
        socket.to(this.roomCode).emit("share-move-ai", this.roomCode, moveType, moveData, color);
        
        let curColor = PLAYER_ORDER[this.moveList.length % PLAYER_ORDER.length];
        if (curColor == 4) {
            // If next player is AI
            console.log("Query the AI move");
            ai_socket.emit("query-move", this.roomCode);
        } else {
            // If next player is offline, play automatic move
            this.players.forEach(async (player) => {
                if (player.socket == null && player.color == curColor) {
                    await new Promise(r => setTimeout(r, 500));
                    player.makeRandomMove();
                    return;
                }
            });
        }
    }
}

function hashcode(roomCode) {
    let hash = 0;
    for (let i = 0; i < roomCode.length; i++) {
        const charCode = roomCode.charCodeAt(i);
        hash += (charCode * 19762) % 26531;
    }
    return hash;
}

/*
 * Player class manages each client that joins a game as a player.
 * Inits event listeners related to the game and contains other player info.
 */
class Player {
    constructor(socket, team, room, host) {
        this.socket = socket;
        this.name = "Guest " + Math.floor(Math.random() * 1000);
        this.team = team;
        this.color = 4;
        this.room = room;
        this.host = host;
        this.id = socket.id;

        this.initSocket();
    }

    initSocket() {
        this.socket.on("update-name", (name) => {
            this.name = name;
            this.room.updatePlayer(this);
        });

        this.socket.on("update-color", (color) => {
            this.color = color;
            this.room.updatePlayer(this);
        });

        this.socket.on("start-game", (gameSettings) => {
            this.room.setSettings(gameSettings);
            this.room.startGame(this.socket);
        });

        this.socket.on("make-move", (moveType, moveData, color) => {
           console.log(`make-move: type: ${moveType}, data: ${moveData}, color: ${color}`)
           this.room.makeMove(this.socket, moveType, moveData, color); 
        });

        this.socket.on("out-of-time", () => {
            this.makeRandomMove();
        })

        this.socket.on("init-ai", (cards) => {
            console.log("init-ai!!!!!!!!!!!!!!");
            ai_socket.emit('init-ai', this.room.roomCode, this.room.gameSettings, cards);
        });

        this.socket.on("leave-room", () => {
            let tempSocket = this.socket;
            this.disconnectPlayer();
            initPlayer(true, tempSocket);
        });

        this.socket.on("disconnect", () => {
            this.disconnectPlayer();
        });
    }

    getPlayerInfo() {
        return {"id": this.socket.id, "name": this.name, "color": this.color};
    }

    joinRoom() {
        this.socket.join(this.room.roomCode);
        this.socket.emit("load-room", this.room.roomCode, this.room.getPlayerInfo());
        this.socket.emit("receive-message", "joined the room");
    }

    makeRandomMove() {
        //Play a random card from the player's hand. Can be used when player takes too long, or when a player is disconnected
        console.log("Random move for " + this.color);
        this.room.makeMove(null, 0, {"index": Math.floor(Math.random() * HAND_SIZE)}, this.color + 1);
    }

    reconnectPlayer(socket) {
        this.socket = socket;
        this.id = socket.id;
        this.socket.join(this.room.roomCode);

        this.initSocket();
    }

    disconnectPlayer() {
        console.log(this.name + " has disconnected.");

        if (this.room.inGame) {
            // If the game is in progress, become empty player
            this.socket.removeAllListeners();
            this.socket = null;

            // If all other players are disconnected, destroy room
            if (!this.room.checkOnlinePlayers()) {
                removeRoom(this.room.roomCode);
                return;
            }

            // If it's the current player's turn, make a random move
            if (PLAYER_ORDER[this.room.moveList.length % PLAYER_ORDER.length] == this.color) {
                this.makeRandomMove();
            }
        } else {
            // If in the lobby, then leave
            if (this.host) {
                this.socket.to(this.room.roomCode).emit("kick-player");
            }
            this.socket.to(this.room.roomCode).emit("remove-player", this.getPlayerInfo());
            this.room.removePlayer(this);
            this.socket.removeAllListeners();
        }
    }
}
