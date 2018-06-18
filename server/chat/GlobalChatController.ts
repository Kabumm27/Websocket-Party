import { User } from "../User";
import { Game } from "../games/base/Game";
import { LobbyManager } from "../lobby/LobbyManager";
import { GamesManager } from "../gamesManager";
import { UserManager } from "../UserManager";
import { Validator } from "../utils/";

export class GlobalChatController {
    private io: SocketIO.Server;
    private socket: SocketIO.Socket;
    private currentUser: User;
    private lobbyManager: LobbyManager;
    private gamesManager: GamesManager;
    private userManager: UserManager;

    public constructor(io: SocketIO.Server, socket: SocketIO.Socket, lobbyManager: LobbyManager, gamesManager: GamesManager, userManager: UserManager, currentUser: User) {
        this.io = io;
        this.socket = socket;
        this.currentUser = currentUser;
        this.lobbyManager = lobbyManager;
        this.gamesManager = gamesManager;
        this.userManager = userManager;
    }

    public registerEvents() {
        this.socket.on("chatAction", (data: any) => {
            try {
                //console.log("Data: ", data);

                if (data.msg) {
                    var channel = data.channel;
                    if (channel) {
                        if (channel === "global") {
                            this.io.emit("newMessage", { from: this.currentUser.name, to: "", msg: data.msg, channel: "global" });
                        }
                        else if (channel === "whisper") {
                            if (data.target) {
                                let targetUser = this.userManager.getUserByName(data.target);
                                if (targetUser) {
                                    this.io.to(targetUser.socketRoomId).emit("newMessage", { from: this.currentUser.name, to: targetUser.name, msg: data.msg, channel: "whisper" });
                                    this.io.to(this.currentUser.socketRoomId).emit("newMessage", { from: this.currentUser.name, to: targetUser.name, msg: data.msg, channel: "whisper" });
                                }
                                else {
                                    console.log("GlobalChatController - Error: User does not exist.");
                                }
                            }
                        }
                        else if (channel === "game") {
                            if (data.roomId) {
                                let targetGame = this.gamesManager.getGameById(data.roomId);
                                if (targetGame && targetGame.isUserInGame(this.currentUser)) {
                                    this.io.to(targetGame.id).emit("newMessage", { from: this.currentUser.name, to: "", msg: data.msg, channel: "game" });
                                }
                                else {
                                    console.log("GlobalChatController - Error: Game does not exist.");
                                }
                            }
                        }
                        else if (channel === "lobby") {
                            if (data.roomId) {
                                let targetLobby = this.lobbyManager.getLobbyById(data.roomId);
                                if (targetLobby && targetLobby.isUserInLobby(this.currentUser)) {
                                    this.io.to(targetLobby.id).emit("newMessage", { from: this.currentUser.name, to: "", msg: data.msg, channel: "lobby" });
                                }
                                else {
                                    console.log("GlobalChatController - Error: Lobby does not exist.");
                                }
                            }
                        }
                    }
                }
            }
            catch (e) {
                console.log("GlobalChatController - chatAction: ", e, e.stack);
            }
        });


        // Will replace chatAction, when ready
        this.socket.on("chatEvent", (data: ChatEvent) => {
            try {
                // Validation
                if (!Validator.isString(data.channel)) throw new Error("No channel defined!");
                if (!Validator.isString(data.message)) throw new Error("No message content!");

                // TODO?: Sanitize data.message?

                // Process global and whisper messages
                if (data.channel === "global") {
                    this.io.emit("chatMessage", {
                        type: "globalMessage",
                        chanel: "global",
                        roomId: null,
                        timestamp: Date.now(),
                        from: this.currentUser.name,
                        to: "all",
                        message: data.message 
                    });
                }
                else if (data.channel === "whisper") {
                    if (!Validator.isString(data.subChannel)) throw new Error("No target defined!");
                    const targetUser = this.userManager.getUserByName(data.subChannel);

                    if (!targetUser) throw new Error("User does not exist!");
                    
                    const chatMessage: any = {
                        type: "whisper",
                        channel: "user",
                        roomId: null,
                        timestamp: Date.now(),
                        from: this.currentUser.name, 
                        to: targetUser.name, 
                        message: data.message
                    };
                    this.io.to(targetUser.socketRoomId).emit("chatMessage", chatMessage);
                    this.io.to(this.currentUser.socketRoomId).emit("chatMessage", chatMessage);
                }

                // Send lobby chat messages to lobby
                else if (data.channel === "lobby") {
                    if (!Validator.isString(data.channelId)) throw new Error("No channelId defined!");
                    const lobby = this.lobbyManager.getLobbyById(data.channelId);

                    if (!lobby) throw new Error("Lobby does not exist!");
                    if (!lobby.isUserInLobby(this.currentUser)) throw new Error("User not in selected lobby!");

                    lobby.lobbyChat.sendMessage(this.currentUser, data.message, this.io);
                }

                // Send game chat messages to game instances
                else if (data.channel === "game") {
                    if (!Validator.isString(data.channelId)) throw new Error("No channelId defined!");
                    if (!Validator.isString(data.subChannel)) throw new Error("No subChannel defined!");
                    const game = this.gamesManager.getGameById(data.channelId);

                    if (!game) throw new Error("Game does not exist!");
                    if (!game.isUserInGame(this.currentUser)) throw new Error("User not in selected game!");

                    game.gameChat.sendMessage(this.currentUser, data.subChannel, data.message);
                }

                // default
                else {
                    throw new Error("Invalid channel defined!");
                }

            } catch (error) {
                const e: Error = error;
                console.log("GlobalChatController - chatEvent: ", e, e.stack);
                console.log(data);
            }
        });
    }
}


// TODO: Move to ChatManager
export type ChatEvent = {
    channel: string,
    subChannel?: string, // like all, team, officer, ...
    channelId?: string, // like gameId, lobbyId, userId, ...
    message: string
};