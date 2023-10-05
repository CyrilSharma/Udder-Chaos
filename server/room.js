const TEAM = {
    ALIEN: true,
    HUMAN: false,
}

const COLOR = {
    RED: 0,
    YELLOW: 1,
    BLUE: 2,
    GREEN: 3,    
}

const MAX_PLAYERS = 4;

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
        console.log(socket.id + " joined the room: " + this.roomCode);
    }

    removePlayer(playerId) {
        // Loop through players to find the correct player to remove
        for (let player in this.players) {
            if (player.socketId == playerId) {
                this.players.remove(player);
                break;
            }
        }
    }

    startGame(io) {
        // Send starting game info to players
        io.to(this.roomCode).emit('receive-message', 'Starting a new game')
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
        this.socket.on('disconnect', () => {
            this.disconnectPlayer();
        });
    }

    joinRoom() {
        this.socket.join(this.room.roomCode);
        this.socket.emit("load-room", this.room.roomCode);
        this.socket.emit("receive-message", "joined the room");
    }

    disconnectPlayer() {
        console.log(this.name + " has disconnected.")
    }
}
