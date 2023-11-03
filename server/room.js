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

const MAX_PLAYERS = 1;

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
        this.turn = 0;
        this.setSeed(roomCode);
    }

    addNewPlayer(socket, host=false) {
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

    setSeed(seed) {
        if (seed === "") {
            return;
        }
        let numSeed = 0;
        for (let i = 0; i < seed.length; i++) {
            numSeed += seed.charCodeAt(i);
        }
        this.seed = numSeed;
    }

    startGame(host) {
        if (this.players.length == MAX_PLAYERS) {
            // Send starting game info to players
            for (let i = 0; i < MAX_PLAYERS; i++) {
                if (this.players[i].color == 4) {
                    // If any player is unset color, stop with error.
                    host.emit("start-game-error", "Everyone must choose a color!");
                    return;
                }
            }
            this.io.to(this.roomCode).emit('start-game', this.seed, this.getPlayerInfo());
        }
        else {
            // Not enough players yet
            host.emit("start-game-error", "Not enough players to start the game!");
        }
    }

    // Emit move to all players
    makeMove(socket, moveType, moveData, color) {
        //TODO: Check if player's turn 
        this.moveList.push((moveType, moveData, color));
        socket.to(this.roomCode).emit("share-move", moveType, moveData, color);
        if (moveType < 2) {
            this.turn += 1;
        }
        if (this.turn % 3 == 2) {
            console.log("Query the AI move");
            ai_socket.emit("query-move", this.roomCode);
        }
    }
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

        this.socket.on("start-game", (seed) => {
            this.room.setSeed(seed);
            this.room.startGame(this.socket);
        });

        this.socket.on("make-move", (moveType, moveData, color) => {
           this.room.makeMove(this.socket, moveType, moveData, color); 
        });

        this.socket.on("leave-room", () => {
            this.disconnectPlayer();
            initPlayer(true, this.socket);
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

    disconnectPlayer() {
        console.log(this.name + " has disconnected.");
        if (this.host) {
            this.socket.to(this.room.roomCode).emit("kick-player");
        }
        this.room.removePlayer(this);
        this.socket.removeAllListeners();
    }
}
