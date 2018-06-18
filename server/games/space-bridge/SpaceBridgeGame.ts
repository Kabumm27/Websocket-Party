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

import { SpaceBridgePlayerExtension } from "./SpaceBridgePlayerExtension";
import { SpaceBridgeHistoryItem } from "./SpaceBridgeHistoryItem";

import { SpaceShip } from "./SpaceShip";
import { Engineer } from "./crew/Engineer";
import { Gunner } from "./crew/Gunner";
import { Pilot } from "./crew/Pilot";
import { Scientist } from "./crew/Scientist";
import { Universe } from "./universe-generation/universe/Universe";

export class SpaceBridgeGame extends Game {

    public timerType = TimerType.realtime;

    private pilot: Pilot;
    private engineer: Engineer;
    private gunner: Gunner;
    private scientist: Scientist;

    private ship: SpaceShip;
    private universe: Universe;

    public constructor(id: string, name: string, users: User[], teams: number[], io: SocketIO.Server, gamesManager: GamesManager, settings: SettingsValue[]) {
        super(id, name, users, teams, io, gamesManager, settings);

        for (var i = 0; i < this.players.length; i++) {
            this.players[i].gameExtension = new SpaceBridgePlayerExtension();
        }

        this.init();
    }

    public onTimerUpdate(dt: number) {
        var now = Date.now();

        this.update(dt, now);
    }

    private update(dt: number, now: number) {
        this.ship.update(dt, now);

        this.ioEmitter.toEach((player: Player) => { return { player: player.toPrivateJson(), game: this.toJson() } });
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
        this.universe = new Universe();

        this.ship = new SpaceShip();
        this.pilot = new Pilot(<SpaceBridgePlayerExtension>this.players[0].gameExtension, this.ship);
        this.engineer = new Pilot(<SpaceBridgePlayerExtension>this.players[0].gameExtension, this.ship);
        this.gunner = new Pilot(<SpaceBridgePlayerExtension>this.players[0].gameExtension, this.ship);
        this.scientist = new Pilot(<SpaceBridgePlayerExtension>this.players[0].gameExtension, this.ship);

        this.ship.setCrew(this.pilot, this.engineer, this.gunner, this.scientist);
    }

    private isValidAction(player: Player, action: string, data: IIncommingData) {
        var PGE = player.gameExtension as SpaceBridgePlayerExtension;
        var that = this;

        //return false;
        return true;
    }

    private applyAction(player: Player, action: string, data: IIncommingData) {
        var PGE = player.gameExtension as SpaceBridgePlayerExtension;
        var that = this;

        if (action === "setShipSpeed") {
            this.pilot.setShipSpeed(data.speed);
        }
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
            players: this.players.map((player) => player.toJson()),
            ship: this.ship.toJson()
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
            console.log("Invalid action.");
        }
    }

    // static information
    public static displayName = "Space Bridge";
    public static label = "spaceBridge";

    public static settings = new Settings([
    ]);

    public static lobby = {
        minUser: 1,
        maxUser: 4,
        teams: {
            count: 0,
            minPlayers: 0,
            maxPlayers: 0,
            required: false
        }
    };

    public static prerequisites(nrOfPlayers: number) {
        return nrOfPlayers >= SpaceBridgeGame.lobby.minUser && nrOfPlayers <= SpaceBridgeGame.lobby.maxUser;
    }

    public static availability = Role.Dev;

    // getter for static variables
    public getDisplayName() {
        return SpaceBridgeGame.displayName;
    }

    public getLabel() {
        return SpaceBridgeGame.label;
    }

    public getSettings() {
        return SpaceBridgeGame.settings;
    }

    public getLobbyInfo() {
        return SpaceBridgeGame.lobby;
    }
}

// TODO: JSON data interfaces
interface IRTSGameState extends IGameState {

}

interface IIncommingData {
    action: string,
    speed?: number
}