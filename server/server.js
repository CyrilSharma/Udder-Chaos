import { Room } from "./room.js"
import { Server } from "socket.io";
import { fileURLToPath } from 'url';
import path from "path"
import express from "express";
import http from "http"

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express()
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

var mode = process.env.NODE_ENV;
console.log(`mode=${mode}`);
// Ship frontend to clients.
var mode = process.env.NODE_ENV;
if (mode != 'development') {
    app.use('/assets', express.static(path.join(__dirname, 'assets')));
    app.use('/images', express.static(path.join(__dirname, 'images')));
    app.use('/sounds', express.static(path.join(__dirname, 'sounds')));
    // We only allow accessing specific files for security reasons.
    app.get('/', (req, res) => {
        res.sendFile(path.join(__dirname, '/index.html'));
    })
    app.get('/favicon.ico', (req, res) => {
        res.sendFile(path.join(__dirname, '/favicon.ico'));
    })
    app.get('/maps.txt', (req, res) => {
        res.sendFile(path.join(__dirname, '/maps.txt'));
    })
    app.listen(80)
}

// Handles connections.
const server_port = (mode == 'development') ? 3000 : 5000; 
server.listen(server_port, () => {
    console.log('listening on ' + server_port);
});

let rooms = {};
export let ai_socket = null;


// Listen for clients and initiate the player socket on connection
io.on('connection', (client) => {
    console.log('A user connected ' + client.id);
    client.on('init-connection', (playerBool) => {
        initPlayer(playerBool, client);
    });
});

/*
 * Initiates the player socket event listeners if a player is connecting
 * Initiates the AI socket listeners otherwise
 */
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
        for (let room in rooms) {
            ai_socket.join(room.roomCode);   
        }

        ai_socket.on("make-move", (roomCode, moveType, moveData, color) => {
            console.log("Make Move was called!");
            console.log(`Roomcode: ${roomCode}`);
            if (rooms[roomCode]) {
                rooms[roomCode].makeMove(socket, moveType, moveData, color);
                console.log("AI made a move " + moveType + "," + color);
            }
        });

        ai_socket.on('disconnect', () => {
            console.log('AI has disconnected.');
            ai_socket = null;
        });
    }
}

/*
 * Create a new Room object which holds players and game information.
 * Inits the player object within the room
 */
function createRoom() {
    let roomCode = generateRoomCode();
    let room = new Room(io, roomCode);
    rooms[roomCode] = room;
    room.addNewPlayer(this, null, true);
    if (ai_socket != null) {
        ai_socket.join(roomCode);
    }
    console.log(this.id + " created a room: " + roomCode)
}

/*
 * Join an existing room by room code. If it doesn't exist, return an error to socket caller
 * Inits the player object within the room
 */
function joinRoom(roomCode, savedID) {
    // Find room by room code
    let room = rooms[roomCode]
    if (room == null) {
        // Emit an error event if the room can't be found
        this.emit("join-error", "Couldn't find room with code " + roomCode);
        return;
    }
    console.log(savedID);
    room.addNewPlayer(this, savedID);
}

/*
 * Returns a random room code, made of 4 random letters
 */
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
    console.log("Deleting room: " + roomCode)
    delete rooms[roomCode];
}