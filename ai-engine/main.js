const { spawn } = require('node:child_process');
const io = require("socket.io-client");
const ai = spawn('cpp/Main');
ai.stdin.setEncoding('utf-8');

// Handles connections.
var mode = process.env.NODE_ENV;
const url =
    (mode == 'development') ?
    'http://localhost:3000':
    'http://udder-chaos.org:5000';

const socket = io(url)

socket.on("start-game", (roomcode, _) => {
    ai.stdin.write('INIT\n');
    ai.stdin.write(`roomcode: {roomcode}\n`);
});

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