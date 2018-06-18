import { Lobby } from "./lobby/Lobby";
import { Privacy } from "./lobby/Lobby";
import { Game } from "./games/Base/Game";
import { Role, User } from "./User";
import {LobbyManager } from "./lobby/LobbyManager";
import { GamesManager } from "./GamesManager";

export default class GameBrowser {
    private static lobbyCounter = 0;

    private io: SocketIO.Server;
    private socket: SocketIO.Socket;
    private currentUser: User;
    private lobbyManager: LobbyManager;
    private gamesManager: GamesManager

    public constructor(io: SocketIO.Server, socket: SocketIO.Socket, lobbyManager: LobbyManager, gamesManager: GamesManager, currentUser: User) {
        this.io = io;
        this.socket = socket;
        this.currentUser = currentUser;
        this.lobbyManager = lobbyManager;
        this.gamesManager = gamesManager;
    }

    public registerEvents() {

        try {
            this.socket.on("browserAction", (data: any) => {
                var action = data.action;

                if (action === "init") {
                    this.socket.emit("browserUpdateLobbies", { lobbies: this.browserEmitGameLobbies() });
                    this.socket.emit("browserUpdateRunningGames", { runningGames: this.browserEmitRunningGames() });
                    this.socket.emit("browserUpdateSelectableGames", { selectableGames: this.browserEmitSelectableGames() });
                }
                else if (action === "refresh") {
                    this.socket.emit("browserUpdateLobbies", { lobbies: this.browserEmitGameLobbies() });
                    this.socket.emit("browserUpdateRunningGames", { runningGames: this.browserEmitRunningGames() });
                }
            });
        }
        catch (e) {
            console.log("Browser: ", e, e.stack);
        }
    }

    private browserEmitGameLobbies() {
        var list = this.lobbyManager.lobbies
            .filter((lobby) => lobby.privacy !== Privacy.Hidden)
            .map(function (lobby) {
            return {
                id: lobby.id,
                name: lobby.name,
                owner: lobby.owner.name,
                user: {
                    min: lobby.minUser,
                    max: lobby.maxUser,
                    current: lobby.userStates.length
                },
                gameName: lobby.gameName
            };
        });

        return list;
    }

    private browserEmitRunningGames() {
        var currentUser = this.currentUser
        var list = currentUser.games.map(function (game) {
            return {
                id: game.id,
                name: game.name,
                gameName: game.getDisplayName(),
                label: game.getLabel(),
                players: game.players.map(function (player) {
                    return {
                        name: player.user.name
                    };
                }),
                isYourTurn: game.isActionRequired(currentUser)
            };
        });

        return list;
    }

    private browserEmitSelectableGames() {
        var gameslist = this.gamesManager.selectableGames
            .filter((Game) => Game.availability <= this.currentUser.role)
            .map((Game) => {
                return {
                    name: Game.displayName,
                    label: Game.label,
                    minUsers: Game.lobby.minUser,
                    maxUsers: Game.lobby.maxUser,
                    category: "multiplayer"
                };
        });

        return gameslist;
    }
}