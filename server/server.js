import { Room } from "./room.js"

import { Server } from "socket.io";
const io = new Server(3000, {
    cors: {
        origin: ["http://localhost:8000"]
    }
})

let rooms = []

io.on('connection', (client) => {
    console.log('A user connected ' + client.id);

    client.on('create-room', createRoom);
    client.on('join-room', joinRoom);

    client.on('disconnect', () => {
        console.log('A user disconnected ' + client.id);
    });
});

function createRoom() {
    // TODO: Add already existing player checking
    let roomCode = generateRoomCode();
    let room = new Room(io, roomCode);
    rooms.push(room);

    room.addNewPlayer(this);

    console.log(this.id + " created a room: " + roomCode)

    //console.log("Rooms: " + rooms)
}

function joinRoom(roomCode) {
    let room = findRoomByCode(roomCode);
    if (room == null) {
        this.emit("receive-message", "Couldn't find room with code " + roomCode);
        return;
    }
    room.addNewPlayer(this);
}

function findRoomByCode(code) {
    console.log("Rooms: ")
    for (let room of rooms) {
        console.log(room.roomCode);
        if (room.roomCode === code) {
            return room;
        }
    }
    return null;
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

export function removeRoom(room) {
    console.log("Removing room:" + room.roomCode);
    console.log(rooms);
    let i = rooms.indexOf(room);
    if (i >= 0) {
        console.log(i);
        rooms.splice(rooms.indexOf(room), 1);
        console.log(rooms);
    } 
}