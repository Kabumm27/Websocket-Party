import { Game } from "./games/base/Game";
import { CompletedGame } from "./games/base/completed-game/CompletedGame";

export class User {
    public name: string;
    public id: string;

    public sessionId: string;
    //public socketId: string;

    public socketRoomId: string;
    public sockets: SocketIO.Socket[] = [];

    public games: Game[] = [];
    public gameHistory: CompletedGame[] = [];

    public role: Role = Role.Player;


    constructor(sessionId: string, id: string, name: string) {
        this.sessionId = sessionId;
        this.name = name;
        this.id = id;
        this.socketRoomId = "userRoom" + id;
    }

    public addGame(game: Game) {
        this.games.push(game);
    }

    public removeGame(game: Game) {
        for (let i = 0; i < this.games.length; i++) {
            if (this.games[i] === game) {
                this.games.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    public isOnline() {
        return this.sockets.length > 0;
    }

    public addSocket(socket: SocketIO.Socket) {
        socket.join(this.socketRoomId);

        this.sockets.push(socket);
    }

    public removeSocket(socket: SocketIO.Socket) {
        for (let i = 0; i < this.sockets.length; i++) {
            if (this.sockets[i] === socket) {
                this.sockets.splice(i, 1);
                break;
            }
        }
    }

    public getSocketsInRoom(room: string, io: SocketIO.Server) {
        //const roomSocketDictionary = io.in(room).sockets;

        const socketIoRoom = io.sockets.adapter.rooms[room];
        if (!socketIoRoom) return [];

        const roomSocketDictionary = socketIoRoom.sockets;
        const socketsInRoom: SocketIO.Socket[] = [];

        for (let socket of this.sockets) {
            if (roomSocketDictionary[socket.id]) {
                socketsInRoom.push(socket);
            }
        }

        return socketsInRoom;
    }

    public moveGameToHistory(game: Game, completedGame: CompletedGame) {
        this.gameHistory.push(completedGame);
        this.removeGame(game);
    }
}

export enum Role {
    Player,
    Tester,
    Dev
}