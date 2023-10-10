import { removeRoom } from "./server.js"

const TEAM = {
    ALIEN: true,
    HUMAN: false,
}

const COLOR = {
    RED: 0,
    YELLOW: 1,
    BLUE: 2,
    PURPLE: 3,    
}

const MAX_PLAYERS = 2;
const SEED_SIZE = 3;

export class Room {
    constructor(io, roomCode) {
        this.io = io;
        this.roomCode = roomCode;
        this.players = [];
        this.gameSeed = 0;
        this.moveList;
    }

    addNewPlayer(socket) {
        if (this.players.length >= MAX_PLAYERS) {
            socket.emit("receive-message", "This room is full!");
            console.log(socket.id + " couldn't join room: " + this.roomCode);
            return;
        }

        let player = new Player(socket, TEAM.ALIEN, this);
        this.players.push(player);

        player.joinRoom();
        socket.to(this.roomCode).emit("player-list", this.getPlayerNames());
        this.io.to(this.roomCode).emit("receive-message", "ROOOM")
        console.log(socket.id + " joined the room: " + this.roomCode);
    }

    removePlayer(player) {
        // Loop through players to find the correct player to remove
        let i = this.players.indexOf(player);
        this.players.splice(i, 1);
        console.log("new list" + this.getPlayerNames());

        if (this.players.length > 0) {
            // There are still players in the game
            io.to(this.roomCode).emit("player-list", this.getPlayerNames());
        }
        else {
            removeRoom(this);
        }
    }

    getPlayerNames() {
        let names = []
        for (let player of this.players) {
            names.push(player.name)
        }
        return names;
    }

    getPlayerIds() {
        let ids = []
        for (let player of this.players) {
            ids.push(player.socket.id)
        }
        return ids;
    }

    startGame(host) {
        if (this.players.length == MAX_PLAYERS) {
            // Send starting game info to players
            this.gameSeed = Math.floor(Math.random()*SEED_SIZE);
            this.io.to(this.roomCode).emit('start-game', this.gameSeed, this.getPlayerIds());
        }
        else {
            // Not enough players yet
            host.emit("start-game-error", "Not enough players to start the game!");
        }
    }
}

// Each client that connects to a game will be a Player.
class Player {
    constructor(socket, team, room) {
        this.socket = socket;
        this.name = "Guest " + Math.floor(Math.random() * 1000);
        this.team = team;
        this.room = room;

        this.initSocket();
    }

    initSocket() {
        this.socket.on("start-game", () => {
            this.room.startGame(this.socket);
        });

        this.socket.on("leave-room", () => {
            this.disconnectPlayer();
        });

        this.socket.on("disconnect", () => {
            this.disconnectPlayer();
        });
    }

    joinRoom() {
        this.socket.join(this.room.roomCode);
        this.socket.emit("load-room", this.room.roomCode, this.room.getPlayerNames());
        this.socket.emit("receive-message", "joined the room");
    }

    disconnectPlayer() {
        console.log(this.name + " has disconnected.")
        this.room.removePlayer(this);
        this.socket.removeAllListeners("start-game");
        this.socket.removeAllListeners("leave-room");
        this.socket.removeAllListeners("disconnect");
    }
}
