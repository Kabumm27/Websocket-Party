import { Player } from "../Base/Player";
import { PlayerGameExtension } from "../Base/PlayerGameExtension";

export class SecretHitlerPlayerExtension extends PlayerGameExtension {

    public isDead: boolean;

    public role: string;
    public isNotHitler: boolean;
    public partyMembership: string;

    public voted: boolean;
    public votedFor: boolean;

    public presidentPolicyCards: number[] = [];
    public chancellorPolicyCards: number[] = [];
    public policyPeek: number[] = [];

    public inspectedPlayers: Player[] = [];

    private fascistsTeam: Player[];

    public constructor() {
        super();

        this.reset();
    }

    public reset() {
        this.endTurn();

        this.isDead = false;
        this.isNotHitler = false;
    }

    public endTurn() {
        this.voted = false;
        // this.votedFor = false;
    }

    public setRole(role: string) {
        if (role === "Liberal") {
            this.partyMembership = "Liberal";
        }
        else {
            this.partyMembership = "Fascist";
        }

        this.role = role;
    }

    public setFascistsTeam(players: Player[]) {
        this.fascistsTeam = players;
    }

    public toPrivateJson() {
        var fascists: any[] = [];
        if (this.fascistsTeam) {
            fascists = this.fascistsTeam.map((player: Player) => {
                return {
                    id: player.user.id,
                    isHitler: (<SecretHitlerPlayerExtension>player.gameExtension).role === "Hitler"
                }
            });
        }

        var inspectedPlayers: any[] = this.inspectedPlayers.map((player) => {
            return {
                id: player.user.id,
                partyMembership: (<SecretHitlerPlayerExtension>player.gameExtension).partyMembership
            }
        });

        return {
            inspectedPlayers: inspectedPlayers,
            teammates: fascists,
            voted: this.voted,
            votedFor: this.votedFor,
            role: this.role,
            isDead: this.isDead,
            partyMembership: this.partyMembership,
            presidentPolicyCards: this.presidentPolicyCards,
            chancellorPolicyCards: this.chancellorPolicyCards,
            policyPeek: this.policyPeek
        };
    }

    public toJson() {
        var inspectedPlayers = this.inspectedPlayers.map((player) => {
            return {
                id: player.user.id
            }
        });

        return {
            inspectedPlayers: inspectedPlayers,
            voted: this.voted,
            isDead: this.isDead,
            isNotHitler: this.isNotHitler
        };
    }
}