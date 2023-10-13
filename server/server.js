import { Room } from "./room.js"
import { Server } from "socket.io";
const io = new Server(3000, {
    cors: {
        origin: "*",
    }
})

let rooms = {};
export let ai_socket = null;

console.log("Server listening on 3000")

io.on('connection', (client) => {
    console.log('A user connected ' + client.id);

    client.on('init-connection', (playerBool) => {
        initPlayer(playerBool, client);
    });
});

export function initPlayer(playerBool, socket) {
    if (playerBool) {
        // Init player socket listeners
        socket.on('create-room', createRoom);
        socket.on('join-room', joinRoom);

        socket.on('disconnect', () => {
            console.log('A user disconnected ' + socket.id);
        });
    }
    else {
        // Connection is the AI engine
        console.log('AI has connected.');
        if (ai_socket != null) {
            console.log('AI has already connected!');
            return;
        }
        ai_socket = socket;

        socket.on("make-move", (roomCode, cardIndex, color) => {
            rooms[roomCode].makeMove(socket, cardIndex, color);
            console.log("AI made a move " + cardIndex + "," + color);
        });

        socket.on('disconnect', () => {
            console.log('AI has disconnected.');
            ai_socket = null;
        });
    }
}

function createRoom() {
    // TODO: Add already existing player checking
    let roomCode = generateRoomCode();
    let room = new Room(io, roomCode);
    rooms[roomCode] = room;

    room.addNewPlayer(this);

    console.log(this.id + " created a room: " + roomCode)
}

function joinRoom(roomCode) {
    let room = rooms[roomCode]
    if (room == null) {
        this.emit("receive-message", "Couldn't find room with code " + roomCode);
        return;
    }
    room.addNewPlayer(this);
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
    } while (roomCode in rooms) // If room exists, try again
    return roomCode
}

export function removeRoom(roomCode) {
    delete rooms[roomCode];
}