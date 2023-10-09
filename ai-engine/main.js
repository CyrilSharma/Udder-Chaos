const io = require("socket.io-client")

const socket = io("http://localhost:3000")

socket.on("connect", () => {
    console.log(`You connected with id: ${socket.id}`)
    socket.emit("init-connection", false);
});

socket.on("query-move", () => {
    let move = Math.floor(Math.random() * 3);
    socket.emit("make-move", socket.id, move);
});