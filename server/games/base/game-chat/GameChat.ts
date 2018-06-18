import { User } from "../../../User";
import { IoEmitter } from "../IoEmitter";
import { GameChatMessage } from "./GameChatMessage";


export class GameChat {
    private gameId: string;
    private io: IoEmitter;

    private messageHistory: GameChatMessage[] = [];
    private gameLog: GameChatMessage[] = [];

    public constructor(gameId: string, io: IoEmitter) {
        this.gameId = gameId;
        this.io = io;
    }

    public sendMessage(from: User, to: string, message: string) {
        const now = Date.now();
        this.messageHistory.push(new GameChatMessage(from.name, to, message, now));

        if (to === "team") {
            this.sendToTeam(from, message, now);
        }
        else {
            this.sendToAll(from, message, now);
        }
    }

    private sendToTeam(from: User, message: string, now: number) {
        this.io.toUsersTeamChat(from, {
            type: "message",
            channel: "game",
            roomId: this.gameId,
            timestamp: now,
            from: from.name,
            to: "team",
            message: message });
    }

    private sendToAll(from: User, message: string, now: number) {
        this.io.toAllChat({
            type: "message",
            channel: "game",
            roomId: this.gameId,
            timestamp: now,
            from: from.name,
            to: "all",
            message: message });
    }

    public getMessages() {
        return this.messageHistory;
    }
}