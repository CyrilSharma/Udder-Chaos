import { io } from "socket.io-client";

class Server {
    socket;

    constructor() {
        this.socket = io("http://localhost:3000");

        this.socket.on("connect", () => {
            console.log(`You connected with id: ${this.socket.id}`)
        });

        this.socket.on("receive-message", (msg) => {
            console.log(msg);
        });
    }

    public async createRoom() {
        this.socket.emit("create-room");
    }

    public async joinRoom(roomCode: string) {
        this.socket.emit("join-room", roomCode);
    }
}

export default new Server();