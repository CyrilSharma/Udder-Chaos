const io = require("socket.io-client")

const socket = io("http://localhost:3000")

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