import { GamesManager } from "./GamesManager";
import { User } from "./User";
import { Game } from "./games/base/Game";

export default class GamesController {

    private io: SocketIO.Server;
    private socket: SocketIO.Socket;
    private currentUser: User;
    private gamesManager: GamesManager;

    public constructor(io: SocketIO.Server, socket: SocketIO.Socket, gamesManager: GamesManager, currentUser: User) {
        this.io = io;
        this.socket = socket;
        this.gamesManager = gamesManager;
        this.currentUser = currentUser;
    }

    public registerEvents() {
        var that = this;

        try {
            this.socket.on("gameInit", function (data: any) {
                if (data.game && data.game.id) {
                    var gameId = data.game.id as string;

                    var game = that.gamesManager.getGameById(gameId);

                    if (game !== null && game.isUserInGame(that.currentUser)) {
                        that.socket.join(game.id);
                        game.onGameInit(that.currentUser, data);
                    }
                    else {
                        that.socket.emit("goToLandingPage");
                    }
                }
            });

            this.socket.on("gameAction", function (data: any) {
                if (data.game && data.game.id) {
                    var gameId = data.game.id as string;

                    var game = that.gamesManager.getGameById(gameId) as Game;

                    if (game !== null && game.isUserInGame(that.currentUser)) {
                        game.onGameAction(that.currentUser, data);
                    }
                    else {
                        that.socket.emit("goToLandingPage");
                    }
                }
            });

            this.socket.on("leaveGameRoom", function (data: any) {
                if (data.game && data.game.id) {
                    var gameId = data.game.id as string;
                    that.socket.leave(gameId);
                }
            });

            this.socket.on("statsInit", function (data: any) {
                if (data.game && data.game.id) {
                    var gameId = data.game.id as string;

                    var game = that.gamesManager.getFinishedGameById(gameId);

                    if (game !== null) {
                        that.socket.emit(game.label + "StatsInit", { stats: game.stats, players: game.players });
                    }
                    else {
                        that.socket.emit("goToLandingPage");
                    }
                }
            });
        }
        catch (e) {
            console.log("GamesController: ", e, e.stack);
        }
    }
}