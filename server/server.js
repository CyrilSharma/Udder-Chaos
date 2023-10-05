import { GameServer } from "./room.js"

import { Server } from "socket.io";
const io = new Server(3000, {
    cors: {
        origin: ["http://localhost:8000"]
    }
})

const MAX_PLAYERS = 4;

var gameServer = new GameServer();

io.on('connection', (client) => {
    console.log('A user connected ' + client.id);

    client.on('send-message', sendMessage);
    client.on('start-room', startRoom);
    client.on('join-room', joinRoom);

    client.on('disconnect', () => {
        console.log('A user disconnected ' + client.id);
        if (client.id in clientRooms) {
            delete clientRooms[client.id];
        }
        console.log(clientRooms)
    });

    function sendMessage(msg) {
        // Client is in a room
        if (client.id in clientRooms) {
            console.log("Room message " + clientRooms[client.id]);
            client.to(clientRooms[client.id]).emit('receive-message', msg);
        }
        else {
            console.log("Send message to all")
            client.broadcast.emit('receive-message', msg)
        }
    }

    function startRoom() {
        roomCode = gameServer.createRoom()

        if (gameServer.moveClientToRoom(client, roomCode)) {
            client.emit("load-room", roomCode);
        }
        console.log("Successfully created a room: " + roomCode)
    }

    function joinRoom(roomCode) {
        console.log(client.id + " joining room " + roomCode);
        const room = io.of('/').adapter.rooms.get(roomCode);

        let roomClients = room ? room : null;
        let numClients = roomClients ? roomClients.size : 0;

        if (numClients == 0) {
            // Room doesn't exist
            client.emit("receive-message", "Couldn't find room with code " + roomCode);
        }
        else if (numClients >= MAX_PLAYERS) {
            // Room is already full
            client.emit("receive-message", "That room is already full!");
        }
        else {
            // Room exists and isn't full
            if (gameServer.moveClientToRoom(client, roomCode)) {
                client.emit("receive-message" , "Joined room with code: " + roomCode);
            }
        }
    }
})
