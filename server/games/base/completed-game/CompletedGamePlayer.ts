import { Stats } from "../game-stats/Stats";

export class CompletedGamePlayer {

    public name: string;
    public stats: Stats;
    public position: number;


    public constructor(stats: Stats, position: number, name: string) {
        this.stats = stats;
        this.position = position;
        this.name = name;
    }
}