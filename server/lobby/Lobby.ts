import { User } from "../User";
import { Game } from "../games/base/Game";
import { Settings } from "../games/base/game-settings/Settings";
import { SettingsValue } from "../games/base/game-settings/SettingsItem";
import { LobbyUserState } from "./LobbyUserState";
import { LobbyChat } from "./lobby-chat/LobbyChat";


export class Lobby {
    public id: string;
    public name: string;
    public game: typeof Game;

    public userStates: LobbyUserState[];
    public banlist: User[];
    public lobbyChat: LobbyChat;

    public owner: User;

    public gameName: string;
    public settings: Settings;
    public settingsValues: SettingsValue[] = [];

    public minUser: number;
    public maxUser: number;

    // Teams
    public nrOfTeams: number;           // 0 == diabled
    public minPlayersPerTeam: number;   // 0 == ignore
    public maxPlayersPerTeam: number;   // 0 == ignore
    public teamRequired: boolean;

    public privacy: Privacy;

    constructor(id: string, name: string, user: User, game: typeof Game, privacy: Privacy, lobbyOptions: LobbyOptions) {
        this.id = id;
        this.name = name;
        this.game = game;
        this.owner = user;

        this.userStates = [];
        this.banlist = [];
        this.privacy = privacy;

        this.lobbyChat = new LobbyChat(this.id);

        const gLobby = game.lobby;
        this.minUser = gLobby.minUser;
        this.maxUser = Math.max(gLobby.minUser, Math.min(gLobby.maxUser, lobbyOptions.maxPlayers));
        this.gameName = game.displayName;
            
        this.nrOfTeams = gLobby.teams.count;
        this.minPlayersPerTeam = gLobby.teams.minPlayers;
        this.maxPlayersPerTeam = gLobby.teams.maxPlayers;
        this.teamRequired = gLobby.teams.required;

        this.settings = game.settings;
        this.settingsValues = this.settings.getDefaultValues();
    }

    public isJoinable(user: User) {
        // If User already in lobby, just allow it
        if (this.isUserInLobby(user)) {
            return true;
        }

        // Lobby is full
        if (this.userStates.length >= this.maxUser) {
            return false;
        }

        // User is banned
        const banned = !this.banlist.every(bannedUser => bannedUser !== user);
        if (banned) {
            return false;
        }

        return true;
    }

    public isUserInLobby(user: User) {
        for (const userState of this.userStates) {
            if (userState.user === user) {
                return true;
            }
        }

        return false;
    }

    public addUser(user: User) {
        if (!this.isUserInLobby(user)) {
            this.userStates.push(new LobbyUserState(user));
            return true;
        }

        return false;
    }

    public removeUser(user: User) {
        for (var i = 0; i < this.userStates.length; i++) {
            if (this.userStates[i].user === user) {
                this.userStates.splice(i, 1);
                break;
            }
        }
    }

    public removeUserById(id: string) {
        for (var i = 0; i < this.userStates.length; i++) {
            if (this.userStates[i].user.id === id) {
                this.userStates.splice(i, 1);
                break;
            }
        }
    }

    public isEmpty() {
        return this.userStates.length > 0;
    }

    public getOptions() {
        return {
            nrOfTeams: this.nrOfTeams,
            minPlayersPerTeam: this.minPlayersPerTeam,
            maxPlayersPerTeam: this.maxPlayersPerTeam,
            teamRequired: this.teamRequired,
            minPlayers: this.minUser,
            maxPlayers: this.maxUser
        };
    }

    public userStateToJSON() {
        var that = this;

        var json = this.userStates.map(function (state) {
            return {
                name: state.user.name,
                id: state.user.id,
                ready: state.ready,
                team: state.team,
                spectator: state.spectator,
                owner: state.user === that.owner
            };
        });

        return json;
    }

    public static getLobbyById(lobbies: Lobby[], lobbyId: string): Lobby {
        for (const lobby of lobbies) {
            if (lobby.id === lobbyId) {
                return lobby;
            }
        }

        return null;
    }
}

export enum Privacy {
    Public,
    Hidden
}

export type LobbyOptions = {
    maxPlayers: number
}