import { Game } from "../base/Game";
import { TimerType } from "../base/Game";
import { IOutgoingData, IGameState } from "../base/Game";
import { Player } from "../base/Player";
import { Role, User } from "../../User";
import { IoEmitter } from "../base/IoEmitter";
import { Settings } from "../base/game-settings/Settings";
import { SettingsValue } from "../base/game-settings/SettingsItem";
import { SettingsItemInteger } from "../base/game-settings/SettingsItemInteger";
import { SettingsItemBoolean } from "../base/game-settings/SettingsItemBoolean";
import { SettingsItemSelection } from "../base/game-settings/SettingsItemSelection";
import { GamesManager } from "../../GamesManager";

import { RTSPlayerExtension } from "./RTSPlayerExtension";
import { RTSHistoryItem } from "./RTSHistoryItem";

export class RTSGame extends Game {
    public timerType = TimerType.realtime;

    public constructor(id: string, name: string, users: User[], teams: number[], io: SocketIO.Server, gamesManager: GamesManager, settings: SettingsValue[]) {
        super(id, name, users, teams, io, gamesManager, settings);

        for (var i = 0; i < this.players.length; i++) {
            this.players[i].gameExtension = new RTSPlayerExtension();
        }

        this.init();
    }

    public onTimerUpdate(dt: number) {
        var now = Date.now();

        this.update(dt, now);
    }

    private update(dt: number, now: number) {
        for (var player of this.players) {
            var PGE = player.gameExtension as RTSPlayerExtension;
            PGE.update(dt, now);
        }
    }

    protected applySettings(settings: SettingsValue[]) {
        // settings
    }

    protected setupStats() {
        // stats
    }

    public reset() {
        super.reset();
        this.setup();   
    }

    protected init() {
        this.setup();
    }

    private setup() {
    }

    private isValidAction(player: Player, action: string, data: IIncommingData) {
        var PGE = player.gameExtension as RTSPlayerExtension;
        var that = this;
        
        return false;
    }

    private applyAction(player: Player, action: string, data: IIncommingData) {
        var PGE = player.gameExtension as RTSPlayerExtension;
        var that = this;
    }
    
    private gameOver() {
        this.onGameOver();
    }

    protected toInitialJson(): IRTSGameState {
        var playerNames: any = {};

        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            playerNames[player.user.id] = player.user.name;
        }

        return {
            options: {
            },
            playerNames: playerNames
        };
    }

    protected toJson(): IRTSGameState {
        return {
            players: this.players.map((player) => player.toJson())
        };
    }

    public onGameAction(user: User, data: IIncommingData) {
        var action = data.action as string;

        var player = this.getPlayerByUser(user) as Player;
        if (this.isValidAction(player, action, data)) {
            this.applyAction(player, action, data);
            var that = this;
            this.ioEmitter.toEach(function (player: Player) { return { player: player.toPrivateJson(), game: that.toJson() } });
        }
        else {
            console.log("Invalid turn.");
        }
    }

    // static information
    public static displayName = "RTS Prototype";
    public static label = "rtsPrototype";

    public static settings = new Settings([
    ]);

    public static lobby = {
        minUser: 1,
        maxUser: 8,
        teams: {
            count: 2,
            minPlayers: 0,
            maxPlayers: 0,
            required: false
        }
    };

    public static prerequisites(nrOfPlayers: number) {
        return nrOfPlayers >= RTSGame.lobby.minUser && nrOfPlayers <= RTSGame.lobby.maxUser;
    }

    public static availability = Role.Dev;

    // getter for static variables
    public getDisplayName() {
        return RTSGame.displayName;
    }

    public getLabel() {
        return RTSGame.label;
    }

    public getSettings() {
        return RTSGame.settings;
    }

    public getLobbyInfo() {
        return RTSGame.lobby;
    }
}

// TODO: JSON data interfaces
interface IRTSGameState extends IGameState {
    
}

interface IIncommingData {
    action: string
}