const io = require("socket.io-client")

// Handles connections.
var mode = process.env.NODE_ENV;
const url = (mode == 'development') ?
    'http://localhost:3000': 'http://udder-chaos.org:5000';
const socket = io(url)

socket.on("connect", () => {
    console.log(`You connected with id: ${socket.id}`)
    socket.emit("init-connection", false);
});

socket.on("query-move", async (roomCode) => {
    await new Promise(r => setTimeout(r, 2000))
    let move = Math.floor(Math.random() * 3);
    let color = Math.floor(Math.random() * 4) + 5;
    socket.emit("make-move", roomCode, move, color);
});