import { User } from "../User";

export class LobbyUserState {
    public user: User;
    
    public ready: boolean;
    public team: number;
    public spectator: boolean;

    public constructor(user: User) {
        this.user = user;

        this.ready = true;
        this.team = 0;
        this.spectator = false;
    }

    public isReady() {
        return this.ready;
    }
}