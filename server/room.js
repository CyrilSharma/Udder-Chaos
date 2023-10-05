
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

export class GameServer {
    constructor() {
        this.rooms = {}
        this.clientRooms = {}
    }

    createRoom() {
        roomCode = generateRoomCode();
        this.rooms[roomCode] = new Room();
        return roomCode;
    }

    moveClientToRoom(client, roomCode) {
        // If they are in a room
        if (client.id in clientRooms) {
            client.emit("receive-message", "You are already in a room!");
            return false
        }
        else {
            this.clientRooms[client.id] = roomCode;
            this.rooms[roomCode].addPlayer(client);
            client.join(roomCode);
            return true
        }
    }
}

class Room {
    constructor() {
        this.players = []
        this.gameSeed = 0
        this.moveList
    }

    addPlayer(player) {
        this.players.push(player);
    }
}

class Player {
    constructor(socketId, team) {
        this.socketId = socketId
        this.name = "Guest " + Math.floor(Math.random() * 1000)
        this.team = team
    }
}


function generateRoomCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    let roomCode = ""
    do {
        // Generate a 4 character room code
        roomCode = "";
        for (let i = 0; i < 4; i++) {
            roomCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }
    } while (io.of('/').adapter.rooms.has(roomCode)) // If room exists, try again

    return roomCode
}