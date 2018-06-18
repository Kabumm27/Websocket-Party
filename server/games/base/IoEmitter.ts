import { User } from "../../User";
import { ChatMessage } from "../../chat/ChatManager";
import { Teams } from "./Teams";
import { Player}  from "./Player";
import { IOutgoingData } from "./Game";

// TODO: Refactor
export class IoEmitter {

    private io: SocketIO.Server;
    private gameId: string;
    private gameLabel: string;
    private players: Player[];
    private teams: Teams;

    public constructor(io: SocketIO.Server, gameId: string, gameLabel: string, players: Player[], teams: Teams) {
        this.io = io;
        this.gameId = gameId;
        this.gameLabel = gameLabel;
        this.players = players;
        this.teams = teams;
    }

    public toTeam(team: number, type: string, data: IOutgoingData) {
        const players = this.teams.getPlayers(team);

        for (const player of players) {
            const socketsInRoom = player.user.getSocketsInRoom(this.gameId, this.io);

            for (const socket of socketsInRoom) {
                socket.emit(type, data);
            }
        }
    }

    public toUsersTeamChat(user: User, data: ChatMessage) {
        const team = this.teams.getUsersTeam(user);
        this.toTeam(team, "chatMessage", data);
    }

    public toTeamChat(team: number, data: ChatMessage) {
        this.toTeam(team, "chatMessage", data);
    }

    public toUserChat(user: User, data: ChatMessage) {
        const socketsFromUserInRoom = user.getSocketsInRoom(this.gameId, this.io);

        for (const socket of socketsFromUserInRoom) {
            socket.emit("chatMessage", data);
        }
    }

    public toAllChat(data: ChatMessage) {
        this.io.to(this.gameId).emit("chatMessage", data);
    }

    public toUser(user: User, data: IOutgoingData, type = "Update") {
        const socketsFromUserInRoom = user.getSocketsInRoom(this.gameId, this.io);
        const messageType = this.gameLabel + type;

        for (const socket of socketsFromUserInRoom) {
            socket.emit(messageType, data);
        }
    }

    public toPlayer(player: Player, data: IOutgoingData, type = "Update") {
        this.toUser(player.user, data, type);
    }

    public toEveryone(data: IOutgoingData, type = "Update") {
        const messageType = this.gameLabel + type;

        this.io.to(this.gameId).emit(messageType, data);
    }

    public toEach(callback: (player: Player) => IOutgoingData, type = "Update") {
        for (let i = 0; i < this.players.length; i++) {
            const player = this.players[i];

            this.toPlayer(player, callback(player), type);
        }
    }

    public emit(eventName: string, data: IOutgoingData) {
        this.io.to(this.gameId).emit(eventName, data);
    }

    public turnNotification(player: Player) {
        const socketsFromUserInRoom = player.user.getSocketsInRoom(this.gameId, this.io);

        if (socketsFromUserInRoom.length === 0) {
            this.io.to(player.user.socketRoomId).emit("gameTurnNotification", { gameId: this.gameId });
        }
    }
}