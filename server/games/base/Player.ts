import { User } from "../../User";
import { PlayerGameExtension } from "./PlayerGameExtension";
import { Stats } from "./game-stats/Stats";

export class Player {
    public user: User;
    public gameExtension: PlayerGameExtension;

    public stats: Stats;

    public constructor(user: User) {
        this.user = user;
        this.gameExtension = new PlayerGameExtension();
        this.stats = new Stats();
    }

    public reset() {
        
    }

    public toPrivateJson() {
        return {
            name: this.user.name,
            id: this.user.id,
            state: this.gameExtension.toPrivateJson()
        };
    }

    public toInitialPrivateJson() {
        return {};
    }

    public toJson() {
        return {
            name: this.user.name,
            id: this.user.id,
            isConnected: true,
            state: this.gameExtension.toJson()
        };
    }

    public toInitialJson() {
        return {};
    }
}