import { User } from "../../../User";

export class GameLogEntry {
    public timestamp: number;

    public data: {};
    public message: string;

    public associatedUser: User;
    public team: number;

    public constructor(message: string, data: {}, user: User, team: number) {
        this.message = message;
        this.associatedUser = user;
        this.team = team;

        this.timestamp = Date.now();
    }
}