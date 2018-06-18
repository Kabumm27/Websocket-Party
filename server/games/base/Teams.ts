import { User } from "../../User";
import { Player } from "../base/Player";


export class Teams {

    private teams: number[] = [];
    private playerTeams: { player: Player, team: number }[] = [];


    public constructor(players: Player[], teams: number[]) {
        for (let i = 0; i < players.length; i++) {
            this.playerTeams.push({
                player: players[i],
                team: teams[i]
            });
        }

        for (const team of teams) {
            if (this.teams.indexOf(team) === -1) {
                this.teams.push(team);
            }
        }
    }

    public getTeam(player: Player) {
        return this.getUsersTeam(player.user);
    }

    public getPlayers(team: number) {
        const players: Player[] = [];

        for (const playerTeam of this.playerTeams) {
            if (playerTeam.team === team) {
                players.push(playerTeam.player);
            }
        }

        return players;
    }

    public getTeammates(player: Player) {
        return this.getUsersTeammates(player.user);
    }

    public getUsersTeam(user: User) {
        for (const playerTeam of this.playerTeams) {
            if (playerTeam.player.user === user) {
                return playerTeam.team;
            }
        }

        return null;
    }

    public getUsersTeammates(user: User) {
        const team = this.getUsersTeam(user);

        return this.getPlayers(team);
    }

    public countTeams() {
        // TODO: Team 0 === no team!
        return this.teams.length;
    }
}