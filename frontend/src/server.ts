import { io } from "socket.io-client";

class Server {
    socket;

    constructor() {
        this.socket = io("http://localhost:3000");

        this.socket.on("connect", () => {
            console.log(`You connected with id: ${this.socket.id}`)
        });
    }

    public async startRoom() {
        this.socket.emit("start-room");
    }
}

export default new Server();