

export class LobbyChatMessage {
    public type: string;
    public from: string;
    public to: string;
    public message: string;
    public timestamp: number;

    public constructor(type: string, from: string, to: string, message: string, timestamp: number) {
        this.type = type;
        this.from = from;
        this.to = to;
        this.message = message;
        this.timestamp = timestamp;
    }
}