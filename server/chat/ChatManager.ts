

export class ChatManager {
    public static sendError(socket: SocketIO.Socket, message: string, roomId = "") {
        socket.emit("chatError", {
            type: "error",
            channel: "user",
            roomId: roomId,
            timestamp: Date.now(),
            from: "system",
            to: "user",
            message: message
        });
    }
}

export interface ChatMessage {
    type: "error" | "message" | "log",
    channel: "global" | "lobby" | "game" | "user",
    roomId: string,
    timestamp: number,
    from: string,
    to: string,
    message: string
}