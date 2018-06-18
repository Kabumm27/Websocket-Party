import { User } from "../../User";

export class ChatMessage {
    date: Date;

    constructor(public roomId: string, public user: User, public message: string) {
        this.roomId = roomId;
        this.user = user;
        this.message = message;

        this.date = new Date();
    }

    toJSON() {
        return {
            type: 'chat',
            roomId: this.roomId,
            name: this.user.name,
            msg: this.message,
            timestamp: this.date.getTime()
        }
    }
}