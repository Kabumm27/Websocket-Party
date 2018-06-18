import { Player } from "./Player";
import { Teams } from "./Teams";
import { GameChat } from "./game-chat/GameChat";
import { Role, User } from "../../User";
import { Settings, SettingsValue } from "./game-settings/";
import { IoEmitter } from "./IoEmitter";
import { GamesManager } from "../../GamesManager";
import { GameLog } from "./game-log/GameLog";
import { Stats } from "./game-stats/Stats";
import { CompletedGame } from "./completed-game/CompletedGame";


export class Game {
    public id: string;
    public name: string;

    public timerType = TimerType.disabled;
    public hotjoinable = false;

    public players: Player[] = [];
    protected settings: Settings;
    protected ioEmitter: IoEmitter;
    protected gamesManager: GamesManager;
    protected history: GameLog;
    protected stats: Stats;
    public gameChat: GameChat;

    protected activePlayers: Player[] = [];
    protected finishedPlayers: Player[] = [];

    protected teams: Teams;

    protected isOver = false;


    public constructor(id: string, name: string, users: User[], teams: number[], io: SocketIO.Server, gamesManager: GamesManager, settings: SettingsValue[]) {
        this.id = id;
        this.name = name;
        this.gamesManager = gamesManager;
        this.settings = new Settings();
        this.stats = new Stats();

        for (const user of users) {
            const player = new Player(user);
            this.players.push(player);
            this.activePlayers.push(player);
        }

        this.teams = new Teams(this.players, teams);
        this.ioEmitter = new IoEmitter(io, id, this.getLabel(), this.players, this.teams);
        this.gameChat = new GameChat(id, this.ioEmitter);
        this.history = new GameLog(id, this.ioEmitter);

        this.applySettings(settings);
        this.initStats();
    }

    // TODO:
    // - Player can surrender
    // - inactivity counter

    protected applySettings(settings: SettingsValue[]) {

    }

    protected initStats() {

    }

    protected reset() {
        // to play again
        this.activePlayers = this.players.slice();
        this.finishedPlayers = [];

        for (var i = 0; i < this.activePlayers.length; i++) {
            this.activePlayers[i].reset();
        }

        this.isOver = false;
    }

    protected init() {
        // setup game
    }

    // Usefull game functions
    protected shuffleList(list: any[]) {
        var counter = list.length;

        while (counter--) {
            var index = (Math.random() * counter) | 0;

            var temp = list[counter];
            list[counter] = list[index];
            list[index] = temp;
        }
    }

    // needed functions
    protected playerFinished(player: Player) {
        for (var i = 0; i < this.activePlayers.length; i++) {
            if (this.activePlayers[i] === player) {
                this.finishedPlayers.push(player);

                this.activePlayers.splice(i, 1);
                break;
            }
        }

        if (this.activePlayers.length === 0) {
            this.onGameOver();
        }
    }

    public isActionRequired(user: User) {
        return true;
    }

    protected isPlayersTurn(player: Player) {
        return this.isActionRequired(player.user);
    }

    protected checkForTurnNotifications() {
        for (var player of this.activePlayers) {
            if (this.isPlayersTurn(player)) {
                this.ioEmitter.turnNotification(player);
            }
        }
    }

    public onTimerUpdate(dt: number) {

    }

    public onGameAction(user: User, data: any) {

    }

    public onGameInit(user: User, data: any) {
        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];

            if (player.user === user) {
                this.ioEmitter.toPlayer(player, { player: player.toInitialPrivateJson(), game: this.toInitialJson() }, "InitialUpdate");
            }
            this.ioEmitter.toPlayer(player, { player: player.toPrivateJson(), game: this.toJson() });
        }
    }

    protected onGameOver(data = {}) {
        this.isOver = true;
        this.timerType = TimerType.disabled;

        //this.ioEmitter.toEveryone(this.finishedPlayers.map(function (player) { return { name: player.user.name }; }), "Gameover");
        this.ioEmitter.toEveryone(data, "Gameover");

        this.gamesManager.finishGame(this);
    }

    // Output
    protected toInitialJson(): IGameState {
        var players = this.players.map(function (p) {
            return { socketId: p.user.id, name: p.user.name };
        });

        return {
            players: players
        };
    }

    protected toJson(): IGameState {
        return {
            gameOver: this.isOver
        };
    }

    // Utils
    protected getPlayerByUser(user: User) {
        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            if (player.user === user) {
                return player;
            }
        }
        return null;
    }

    protected getPlayerById(userId: string) {
        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            if (player.user.id === userId) {
                return player;
            }
        }
        return null;
    }

    public isUserInGame(user: User) {
        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            if (player.user === user) {
                return true;
            }
        }
        return false;
    }

    protected getRandomActivePlayer() {
        var nrOfActivePlayers = this.activePlayers.length;
        var selectedPlayerIndex = Math.floor(Math.random() * nrOfActivePlayers);

        return this.activePlayers[selectedPlayerIndex];
    }

    public toFinishedGame() {
        var label = Object.getPrototypeOf(this).constructor.label;
        return new CompletedGame(this.id, label, this.finishedPlayers, this.history, this.stats);
    }

    // static information
    public static displayName: string;
    public static label: string;

    public static availability: Role = Role.Player;

    public static settings: Settings;

    public static lobby = {
        minUser: 2,
        maxUser: 2,
        teams: {
            count: 0,
            minPlayers: 0,
            maxPlayers: 0,
            required: false
        }
    };

    public static prerequisites(nrOfPlayers: number) {
        return nrOfPlayers >= Game.lobby.minUser && nrOfPlayers <= Game.lobby.maxUser;
    }

    // getter for static variables
    public getDisplayName() {
        return Game.displayName;
    }

    public getLabel() {
        return Game.label;
    }

    public getSettings() {
        return Game.settings;
    }

    public getLobbyInfo() {
        return Game.lobby;
    }
}

export interface IOutgoingData {

}

export interface IGameState {
    /*
    players: {
        socketId: string,
        name: string
    },
    currentPlayer: Player,
    gameOver: boolean
    */
}

export enum TimerType {
    disabled,
    turnTimer,
    realtime
}