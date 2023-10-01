const { Server } = require("socket.io");
const io = new Server(3000, {
    cors: {
        origin: ["http://localhost:8000"]
    }
})

const MAX_PLAYERS = 4;

// Pairs client ID to their room
var clientRooms = {}

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
        roomCode = generateRoomCode();

        if (moveClientToRoom(client, roomCode)) {
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
            if (moveClientToRoom(client, roomCode)) {
                client.emit("receive-message" , "Joined room with code: " + roomCode);
            }
        }
    }
})

function moveClientToRoom(client, roomCode) {
    // If they are in a room
    if (client.id in clientRooms) {
        client.emit("receive-message", "You are already in a room!");
        return false
    }
    else {
        clientRooms[client.id] = roomCode;
        client.join(roomCode);
        return true
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
