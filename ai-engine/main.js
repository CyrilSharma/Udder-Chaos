const { spawn } = require('node:child_process');
const io = require("socket.io-client");
const readline = require('node:readline');

const MoveType = {
    PlayCard: 0,
    RotateCard: 1,
    PurchaseUFO: 2,
}

const ai = spawn('cpp/Main');
ai.stdin.setEncoding('utf-8');
ai.stderr.on('data', (data) => {
    process.stdout.write(data);
})

exited = false;
ai.on('exit', (code) => {
    console.log(`AI Exited: ${code}!`);
    exited = true;
});

// https://stackoverflow.com/questions/43638105/how-to-get-synchronous-readline-or-simulate-it-using-async-in-nodejs
const rl = readline.createInterface({
    input: ai.stdout,
    crlfDelay: Infinity
});
const it = rl[Symbol.asyncIterator]();

// Handles connections.
var mode = process.env.NODE_ENV;
const url =
    (mode == 'development') ?
    'http://localhost:3000':
    'http://udder-chaos.org:5000';

const socket = io(url)

socket.on("connect", () => {
    console.log(`You connected with id: ${socket.id}`)
    socket.emit("init-connection", false);
});

socket.on("init-ai", async (room_code, seed, cards) => {
    console.log("AI Initialized!");
    console.log(`Seed: ${seed}`);
    ai.stdin.write('INIT\n');
    ai.stdin.write(`game_id: ${room_code}\n`);
    ai.stdin.write(`seed: ${seed}\n`);
    ai.stdin.write(`ncards: ${cards.length}\n`);
    ai.stdin.write(`END\n`);
    console.log(`cards.length: ${cards.length}\n`);
    console.log(`cards[0].length: ${cards[0].length}\n`);
    for (let card of cards) {
        for (let dir of card) {
            ai.stdin.write(`${dir} `);
        }
        ai.stdin.write('\n');
    }
    console.log("Sent commands to AI...");
    const output = (await it.next()).value;
    console.log(`Output: ${output}`)
});

socket.on("query-move", async (room_code) => {
    console.log("query-move");
    ai.stdin.write('GET\n');
    ai.stdin.write(`game_id: ${room_code}\n`);
    ai.stdin.write(`END\n`);
    const move = (await it.next()).value;
    const color = (await it.next()).value;
    const status = (await it.next()).value;
    console.log(`Receieved: (${move}, ${color}, ${status})`);
    socket.emit("make-move", room_code, MoveType.PlayCard, {"index": move}, color);
});

socket.on("share-move-ai", async (game_id, idx, color) => {
    console.log("share-move-ai");
    console.log(`game_id: ${game_id}, idx: ${idx}`);
    ai.stdin.write('MOVE\n');
    ai.stdin.write(`game_id: ${game_id}\n`);
    ai.stdin.write(`move: ${idx}\n`);
    ai.stdin.write(`END\n`);
    const status = (await it.next()).value;
    console.log(`Status: ${status}`);
});