import { User } from "../../User";
import { LobbyChatMessage } from "./LobbyChatMessage";


export class LobbyChat {
    private lobbyId: string;
    private history: LobbyChatMessage[] = [];

    public constructor(lobbyId: string) {
        this.lobbyId = lobbyId;
    }

    public sendMessage(from: User, message: string, io: SocketIO.Server) {
        const now = Date.now();
        this.history.push(new LobbyChatMessage("message", from.name, "all", message, now));

        io.to(this.lobbyId).emit("chatMessage", {
            type: "message",
            channel: "lobby",
            roomId: this.lobbyId,
            timestamp: now,
            from: from.name,
            to: "all",
            message: message });
    }

    public log(message: string, io: SocketIO.Server) {
        const now = Date.now();
        this.history.push(new LobbyChatMessage("log", "system", "user", message, now));

        io.to(this.lobbyId).emit("chatLog", {
            type: "log",
            channel: "lobby",
            roomId: this.lobbyId,
            timestamp: now,
            from: "system",
            to: "user",
            message: message });
    }

    public sendHistory(socket: SocketIO.Socket) {
        const messageHistory = this.history.map(lcm => {
            return {
                type: lcm.type,
                roomId: this.lobbyId,
                timestamp: lcm.timestamp,
                from: lcm.from,
                to: lcm.to,
                message: lcm.message
            }
        });

        socket.emit("chatHistory", messageHistory);
    }
}