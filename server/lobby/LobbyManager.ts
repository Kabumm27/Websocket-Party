import { Lobby } from "./Lobby";
import { User } from "../User";

export class LobbyManager {
    public lobbies: Lobby[];

    public constructor() {
        this.lobbies = [];
    }

    public getLobbyById(lobbyId: string) {
        for (var i = 0; i < this.lobbies.length; i++) {
            var lobby = this.lobbies[i];
            if (lobby.id == lobbyId) {
                return lobby;
            }
        }

        return null;
    }

    public getLobbiesByUser(user: User) {
        return this.lobbies.filter((lobby: Lobby) => lobby.isUserInLobby(user));
    }

    public addLobby(lobby: Lobby) {
        this.lobbies.push(lobby);
    }

    public removeLobby(lobby: Lobby) {
        return this.removeLobbyById(lobby.id);
    }

    public removeLobbyById(lobbyId: string) {
        for (var i = 0; i < this.lobbies.length; i++) {
            if (this.lobbies[i].id == lobbyId) {
                this.lobbies.splice(i, 1);
                return true;
            }
        }

        return false;
    }
}