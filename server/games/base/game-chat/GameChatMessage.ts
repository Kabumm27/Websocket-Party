

export class GameChatMessage {
    public from: string;
    public to: string;
    public message: string;
    public timestamp: number;

    public constructor(from: string, to: string, message: string, timestamp: number) {
        this.from = from;
        this.to = to;
        this.message = message;
        this.timestamp = timestamp;
    }
}