const { spawn } = require('node:child_process');
const io = require("socket.io-client");
const readline = require('node:readline');

const ai = spawn('cpp/Main');
ai.stdin.setEncoding('utf-8');

const rl = readline.createInterface({
    input: ai.stdout,
    terminal: false
});

// Promisify the readline interface to read one line
function read_output() {
    return new Promise((resolve) => {
        rl.once('line', (line) => {
            resolve(line);
            rl.close();
        });
    });
  }

// Handles connections.
var mode = process.env.NODE_ENV;
const url =
    (mode == 'development') ?
    'http://localhost:3000':
    'http://udder-chaos.org:5000';

const socket = io(url)

socket.on("start-game", async (roomcode, seed) => {
    ai.stdin.write('INIT\n');
    ai.stdin.write(`game_id: {roomcode}\n`);
    ai.stdin.write(`seed: {seed}\n`);
    ai.stdin.write(`END\n`);
    const output = await read_output();
    console.log(`Output: {output}`)
});

socket.on("connect", () => {
    console.log(`You connected with id: ${socket.id}`)
    socket.emit("init-connection", false);
});

socket.on("query-move", async (roomCode) => {
    ai.stdin.write('GET\n');
    ai.stdin.write(`game_id: {roomcode}\n`);
    ai.stdin.write(`END\n`);
    const move = await read_output();
    const status = await read_output();
    console.log(`Got: {move}`)
    console.log(`Status: {status}`)
    let color = Math.floor(Math.random() * 4) + 5;
    socket.emit("make-move", roomCode, move, color);
});