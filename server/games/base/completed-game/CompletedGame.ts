import { Player } from "../Player";
import { CompletedGamePlayer } from "./CompletedGamePlayer";
import { SettingsValue } from "../game-settings/SettingsItem";
import { Stats } from "../game-stats/Stats";
import { GameLog } from "../game-log/GameLog";

// TODO: Check for rework
export class CompletedGame {

    public id: string;
    public label: string;
    public settings: SettingsValue[];

    public players: CompletedGamePlayer[] = [];
    public history: GameLog;
    public stats: Stats;


    public constructor(id: string, gameLabel: string, players: Player[], history: GameLog, stats: Stats) {
        this.id = id;
        this.label = gameLabel;
        this.history = history;
        this.stats = stats

        for (var i = 0; i < players.length; i++) {
            var player = players[i];
            this.players.push(new CompletedGamePlayer(player.stats, i, player.user.name));
        }
    }


}