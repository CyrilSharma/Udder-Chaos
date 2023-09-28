const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server)


class ServerRooms {
    rooms = [];

    addRoom(room) {
        this.rooms.push(room);
    }

    findOpenRoom() {
        for (let room of this.rooms) {
            if (room.getSize() < 3) {
                return room
            }
        }
        return null
    }

    findPlayerRoom(player) {
        console.log(this.rooms)
        for (let room of this.rooms) {
            if (room.players.includes(player)) {
                return room
            }
        }
        return null
    }
}

class Room {
    constructor(roomId, players) {
        this.roomId = roomId;
        this.players = players;
    }

    // Join a room with a player id if there's space
    joinRoom(player) {
        if (this.players.length < 3) {
            this.players.push(player);
        }
        else {
            console.log("No space in room " + this.roomId);
        }
    }

    getSize() {
        return this.players.length;
    }
}

rooms = new ServerRooms()

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
    console.log('a user connected' + socket.id);

    socket.on('chat message', (msg) => {
        room = rooms.findPlayerRoom(socket.id);
        if (room) {
            console.log("to room: " + room.roomId)
            socket.to(room.roomId).emit('chat message', msg);
        }
        else {
            console.log("public")
            socket.broadcast.emit('chat message', msg)
        }
    });
    socket.on('disconnect', () => {
        console.log('user disconnected')
    });

    socket.on('start-room', () => {
        room = new Room(socket.id, [socket.id])
        rooms.addRoom(room);
    });

    socket.on('join-room', () => {
        openRoom = rooms.findOpenRoom();
        if (openRoom) {
            openRoom.joinRoom(socket.id);
            socket.join(openRoom.roomId);
            console.log("joining room: " + openRoom.roomId)
        }
    })
})

server.listen(3000, () => {
    console.log('listening on *:3000');
})


