import { User } from "../../../User";
import { IHistoryItem } from "./IHistoryItem";
import { GameLogEntry } from "./GameLogEntry";
import { IoEmitter } from "../IoEmitter";


export class GameLog {
    private gameId: string;
    private io: IoEmitter;

    public historyItems: IHistoryItem[] = []; // TODO: Remove
    private entries: GameLogEntry[] = [];

    public constructor(gameId: string, io: IoEmitter) {
        this.gameId = gameId;
        this.io = io;
    }

    public log(message: string, data: {}) {
        const logEntry = this.logMessage(message, data, null, null);

        this.io.toAllChat({
            type: "log",
            channel: "game",
            roomId: this.gameId,
            timestamp: Date.now(),
            from: "game",
            to: "all",
            message: message });
    }

    public logForUser(message: string, data: {}, user: User) {
        this.logMessage(message, data, user, null);
        
        this.io.toUserChat(user, {
            type: "log",
            channel: "game",
            roomId: this.gameId,
            timestamp: Date.now(),
            from: "game",
            to: user.name,
            message: message });
    }

    // Do I need this?
    public logForTeam(message: string, data: {}, team: number) {
        this.logMessage(message, data, null, team);
        
        this.io.toTeamChat(team, {
            type: "log",
            channel: "game",
            roomId: this.gameId,
            timestamp: Date.now(),
            from: "game",
            to: "team",
            message: message });
    }

    private logMessage(message: string, data: {}, user: User, team: number) {
        const logEntry = new GameLogEntry(message, data, user, team);
        this.entries.push(logEntry);

        return logEntry;
    }

    // TODO: Remove
    // public add(historyItem: IHistoryItem) {
    //     this.historyItems.push(historyItem);
    // }
}