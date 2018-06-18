import shortId = require("shortid");

import { Lobby, Privacy, LobbyOptions } from "./Lobby";
import { User } from "../User";
import { Game } from "../games/base/Game";
import { Settings, SettingsValue } from "../games/base/game-settings/";
import { LobbyManager } from "./LobbyManager";
import { GamesManager } from "../GamesManager";
import { UserManager }  from "../UserManager";
import { ChatManager } from "../chat/ChatManager";
import { Validator } from "../utils/";


export class LobbyController {
    private io: SocketIO.Server;
    private socket: SocketIO.Socket;
    private currentUser: User;
    private lobbyManager: LobbyManager;
    private gamesManager: GamesManager;
    private UserManager: UserManager;

    public constructor(io: SocketIO.Server, socket: SocketIO.Socket, lobbyManager: LobbyManager, gamesManager: GamesManager, userManager: UserManager, currentUser: User) {
        this.io = io;
        this.socket = socket;
        this.currentUser = currentUser;
        this.lobbyManager = lobbyManager;
        this.gamesManager = gamesManager;
        this.UserManager = userManager;
    }

    public registerEvents() {
        type LobbyAction = {
            action: string,
            lobbyId: string,

            // New lobby
            lobbyName?: string,
            gameLabel?: string,
            maxUser?: number,
            privacy?: any, // string,

            // User state
            readyState?: boolean,
            team?: number,
            spectator?: boolean,

            // Game settings
            index?: number,
            value?: any,

            // Kick / ban
            userId?: string
        };

        this.socket.on("lobbyAction", (data: LobbyAction) => {
            try {
                if (!Validator.isString(data.action)) throw new Error("No action defined!");
                const action = data.action;
                const lobby = this.lobbyManager.getLobbyById(data.lobbyId);

                // TODO?: double switch-case: 1. validation, 2. action
                if (action === "create") {
                    if (!Validator.isString(data.lobbyName)) throw new Error("Invalid lobbyName!");
                    if (!Validator.isString(data.gameLabel)) throw new Error("Invalid gameLabel!");
                    if (!Validator.isInteger(data.maxUser)) throw new Error("Invalid number of max users!");
                    if (!Validator.isString(data.privacy)) throw new Error("Invalid privacy data!");

                    const privacy: Privacy = <any>Privacy[data.privacy]; // TODO: Change enum...
                    if (privacy === undefined) throw new Error("Invalid privacy option!");
                    
                    this.createLobby(data.lobbyName, data.gameLabel, data.maxUser, privacy);
                }
                else if (action === "init") {
                    if (!lobby) {
                        this.socket.emit("goToBrowser");
                    }
                    else {
                        this.initLobby(lobby);
                    }
                }
                else if (action === "leaveRoom") {
                    if (!lobby) throw new Error("Invalid lobbyId!");

                    this.leaveLobby(lobby);
                }
                else if (action === "changeUserState") {
                    if (!lobby) throw new Error("Invalid lobbyId!");
                    if (!lobby.isUserInLobby(this.currentUser)) throw new Error("You are not in that lobby!");

                    if (!Validator.isBoolean(data.readyState)) throw new Error("Invalid readyState send!");
                    if (!Validator.isInteger(data.team)) throw new Error("Invalid team send!");
                    if (!Validator.isBoolean(data.spectator)) throw new Error("Invalid readyState send!");
                            
                    this.changeUserState(lobby, data.readyState, data.team, data.spectator);
                }
                else if (action === "changeSettings") {
                    if (!lobby) throw new Error("Invalid lobbyId!");
                    if (!lobby.isUserInLobby(this.currentUser)) throw new Error("You are not in that lobby!");
                    if (lobby.owner !== this.currentUser) throw new Error("Invalid permissions!");

                    if (!Validator.isInteger(data.index)) throw new Error("Invalid settings index!");
                    if (!Validator.hasValue(data.value)) throw new Error("No valid sent!");

                    this.changeSettings(lobby, data.index, data.value);
                }
                else if (action === "gameStart") {
                    if (!lobby) throw new Error("Invalid lobbyId!");
                    if (!lobby.isUserInLobby(this.currentUser)) throw new Error("You are not in that lobby!");
                    if (lobby.owner !== this.currentUser) throw new Error("Invalid permissions!");

                    this.startGame(lobby);
                }
                else if (action === "kickPlayer") {
                    if (!lobby) throw new Error("Invalid lobbyId!");
                    if (!lobby.isUserInLobby(this.currentUser)) throw new Error("You are not in that lobby!");
                    if (lobby.owner !== this.currentUser) throw new Error("Invalid permissions!");

                    if (!Validator.isString(data.userId)) throw new Error("Invalid userId!");
                    
                    this.kickPlayer(lobby, data.userId);
                }
                else if (action === "banPlayer") {
                    if (!lobby) throw new Error("Invalid lobbyId!");
                    if (!lobby.isUserInLobby(this.currentUser)) throw new Error("You are not in that lobby!");
                    if (lobby.owner !== this.currentUser) throw new Error("Invalid permissions!");

                    if (!Validator.isString(data.userId)) throw new Error("Invalid userId!");

                    this.banPlayer(lobby, data.userId);
                }
                else {
                    throw new Error("Invalid action!");
                }
            }
            catch (err) {
                const e: Error = err;
                console.log("LobbyController: ", e, e.stack);
                console.log(data);
                ChatManager.sendError(this.socket, e.message);
            }
        });

        this.socket.on("disconnect", () => {
            this.disconnect();
        });
    }

    private createLobby(lobbyName: string, gameLabel: string, maxPlayers: number, privacy: Privacy) {
        const game = this.gamesManager.getSelectableGameByLabel(gameLabel);
        const lobbyId = shortId.generate();

        if (!game) throw new Error("Invalid game selected!");
        if (!Validator.hasLength(lobbyName, 3, 16)) throw new Error("Invalid lobby name length!");

        const lobby = new Lobby(lobbyId, lobbyName, this.currentUser, game, privacy, { maxPlayers: maxPlayers });
        this.lobbyManager.addLobby(lobby);

        this.socket.emit("browserJoinLobby", lobbyId);
    }

    private initLobby(lobby: Lobby) {
        this.join(lobby);

        this.emitInit(lobby);
        this.emitLobbyUserState(lobby);
        this.emitSettings(lobby);
    }

    private join(lobby: Lobby) {
        if (lobby.isJoinable(this.currentUser)) {
            this.socket.join(lobby.id);
            const success = lobby.addUser(this.currentUser);

            if (success) {
                lobby.lobbyChat.log(this.currentUser.name + " joined.", this.io);
            }
        }
        else {
            this.socket.emit("goToBrowser");
        }
    }

    private changeUserState(lobby: Lobby, readyState: boolean, team: number, spectator: boolean) {
        const userState = lobby.userStates.find(state => state.user === this.currentUser);
        userState.ready = readyState;
        userState.team = team;

        this.emitLobbyUserState(lobby);
    }

    private changeSettings(lobby: Lobby, index: number, value: SettingsValue) {
        const settingsItem = lobby.settings.settingsItems[index];
        if (settingsItem.validate(value) !== null) {
            const oldValue = lobby.settingsValues[index];
            lobby.settingsValues[index] = value;

            if (oldValue !== value) {
                lobby.lobbyChat.log("Option \"" + settingsItem.name + "\" changed from <" + oldValue + "> to <" + value + ">" , this.io);
            }

            this.socket.broadcast.to(lobby.id).emit("lobbySettingsValues", { values: lobby.settingsValues });
        }
    }

    private kickPlayer(lobby: Lobby, userId: string) {
        //lobby.removeUserBySocketId(socketId);
        lobby.removeUserById(userId);

        /* TODO: Fix, NOT WORKING
        const kickSocket = this.io.of("/").connected[socketId];
        if (kickSocket != null) {
            kickSocket.leave(lobby.id);
            kickSocket.emit("goToBrowser");
        }
        */

        this.emitLobbyUserState(lobby);
    }

    private banPlayer(lobby: Lobby, userId: string) {
        this.kickPlayer(lobby, userId);

        const user = this.UserManager.getUserById(userId);
        if (user !== null) {
            lobby.banlist.push(user);
        }
    }

    private startGame(lobby: Lobby) {
        const gameId = lobby.id;
        const players = lobby.userStates;
        const gameClass = lobby.game;

        if (!players.every(player => player.isReady())) throw new Error("Some players are not ready!");
        if (!gameClass.prerequisites(players.length)) throw new Error("Not enough players!");

        const game = new gameClass(gameId, lobby.name, players.map(userState => userState.user), players.map(userState => userState.team), this.io, this.gamesManager, lobby.settingsValues);

        // save game instance in gameManager and user objects
        this.gamesManager.addGame(game);
        for (const player of players) {
            player.user.addGame(game);
        }

        this.io.to(lobby.id).emit("lobbyGameStart", { gameController: gameClass.label, gameId: game.id });
    }

    private leaveLobby(lobby: Lobby) {
        this.socket.leave(lobby.id);

        const socketsFromUserInLobby = this.currentUser.getSocketsInRoom(lobby.id, this.io).length;
        if (socketsFromUserInLobby === 0) {
            //console.log("leave");
            lobby.removeUser(this.currentUser);
            lobby.lobbyChat.log(this.currentUser.name + " left.", this.io);

            if (lobby.owner === this.currentUser && lobby.isEmpty()) {
                lobby.owner = lobby.userStates[0].user;
                lobby.lobbyChat.log(lobby.owner.name + " is now the host.", this.io);
            }

            this.socket.leave(lobby.id);
            this.emitLobbyUserState(lobby);

            if (lobby.userStates.length === 0) {
                //console.log("delete");
                this.lobbyManager.removeLobbyById(lobby.id);
            }
        }
    }

    private disconnect() {
        const joinedLobbies = this.lobbyManager.getLobbiesByUser(this.currentUser);
        for (let lobby of joinedLobbies) {
            this.leaveLobby(lobby);
        }
    }

    private emitInit(lobby: Lobby) {
        this.socket.emit("lobbyInital", { gameName: lobby.gameName, options: lobby.getOptions(), userId: this.currentUser.id });
        lobby.lobbyChat.sendHistory(this.socket);
    }

    private emitLobbyUserState(lobby: Lobby) {
        this.io.to(lobby.id).emit("lobbyUserState", lobby.userStateToJSON());
    }

    private emitSettings(lobby: Lobby) {
        this.io.to(lobby.id).emit("lobbySettings", { settings: lobby.settings.toState(), values: lobby.settingsValues });
    }
}