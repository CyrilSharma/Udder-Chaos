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

// ---- Game Settings ---- //
// export const defaultGameSettings = {
//     seed: 0,
//     score_goal: 10,
//     days_per_round: 5,
//     cow_regen_rate: 15,
//     cow_sacrifice: 5,
//     card_deck_size: 15,
//     timer_length: 1000
// }

exitmove = () => {
    socket.emit(
        "make-move", room_code,
        MoveType.PlayCard, {"index": 0}, 5
    );
}

socket.on("init-ai", async (room_code, settings, cards) => {
    console.log("AI Initialized!");
    ai.stdin.write('INIT\n');
    ai.stdin.write(`game_id: ${room_code}\n`);
    ai.stdin.write(`score_goal: ${settings.seed}\n`);
    ai.stdin.write(`days_per_round: ${settings.days_per_round}\n`);
    ai.stdin.write(`cow_regen_rate: ${settings.cow_regen_rate}\n`);
    ai.stdin.write(`cow_sacrifice: ${settings.cow_sacrifice}\n`);
    ai.stdin.write(`seed: ${settings.card_deck_size}\n`);
    ai.stdin.write(`ncards: ${cards.length}\n`);
    ai.stdin.write(`END\n`);
    for (let card of cards) {
        for (let dir of card) {
            ai.stdin.write(`${dir} `);
        }
        ai.stdin.write('\n');
    }
    console.log("Sent commands to AI...");
});

socket.on("query-move", async (room_code) => {
    if (exited) { exitmove(); return; }
    console.log("\nquery-move");
    ai.stdin.write('GET\n');
    ai.stdin.write(`game_id: ${room_code}\n`);
    ai.stdin.write(`END\n`);
    const type = (await it.next()).value;
    const move = (await it.next()).value;
    const color = (await it.next()).value;
    console.log(`Receieved: (${type}, ${move}, ${color})`);
    if (exited) { exitmove(); return; }

    // We do color + 5 to match up with frontend's expectations
    // For what an AI move should look like.
    if (type == MoveType.PlayCard) {
        moveData = { "index": parseInt(move) };
        socket.emit(
            "make-move", room_code, MoveType.PlayCard,
            moveData, parseInt(color) + 5
        );
    } else if (type == MoveType.RotateCard) {
        // What on earth is color supposed to be for rotations?
        moveData = { "index": parseInt(move), "rotation": color };
        socket.emit(
            "make-move", room_code, MoveType.RotateCard,
            moveData, parseInt(color) + 5
        );
    }
});

socket.on("share-move-ai", async (game_id, moveType, moveData, color) => {
    if (exited) return;
    console.log("\nshare-move-ai");
    console.log(`game_id: ${game_id}`);
    console.log(`moveType: ${moveType}`);
    ai.stdin.write('MOVE\n');
    ai.stdin.write(`game_id: ${game_id}\n`);
    if (moveType == MoveType.PlayCard) {
        // Colors are 1-indexed on frontend
        ai.stdin.write(`moveType: 0\n`);
        ai.stdin.write(`index: ${moveData["index"]}\n`);
        ai.stdin.write(`color: ${parseInt(color)}\n`);
        console.log(`index: ${moveData["index"]}`);
        console.log(`color: ${color}`);
    } else if (moveType == MoveType.RotateCard) {
        ai.stdin.write(`moveType: 1\n`);
        ai.stdin.write(`index: ${moveData["index"]}\n`);
        ai.stdin.write(`rotation: ${moveData["rotation"]}\n`);
        console.log(`index: ${moveData["index"]}`);
        console.log(`rotation: ${moveData["rotation"]}`);
    } else if (moveType == MoveType.PurchaseUFO) {
        ai.stdin.write(`moveType: 2\n`);
        ai.stdin.write(`x: ${moveData["column"]}\n`);
        ai.stdin.write(`y: ${moveData["row"]}\n`);
        console.log(`x: ${moveData["column"]}`);
        console.log(`y: ${moveData["row"]}`);
    }
    ai.stdin.write(`END\n`);
});