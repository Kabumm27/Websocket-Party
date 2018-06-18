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

import { RiskPlayerExtension } from "./RiskPlayerExtension";
import { RiskHistoryItem } from "./RiskHistoryItem";
import { ReinforcementManager } from "./ReinforcementManager";
import { Map } from "./Map";
import { Region } from "./Region";

export class RiskGame extends Game {

    private currentPlayer: Player;
    
    private map: Map;

    private reinforcements: ReinforcementManager;

    private turn: number;
    private phase: number;

    public constructor(id: string, name: string, users: User[], teams: number[], io: SocketIO.Server, gamesManager: GamesManager, settings: SettingsValue[]) {
        super(id, name, users, teams, io, gamesManager, settings);

        for (var i = 0; i < this.players.length; i++) {
            this.players[i].gameExtension = new RiskPlayerExtension();
        }

        this.init();
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
        this.map = new Map("defaultMap");
        this.reinforcements = new ReinforcementManager();

        this.setup();
    }

    private setup() {
        let startingUnits = 30;
        const nrOfRegions = this.map.regions.length;
        const nrOfPlayers = this.activePlayers.length;
        const neutralRegions = nrOfRegions % nrOfPlayers;
        const regionsPerPlayer = (nrOfRegions - neutralRegions) / nrOfPlayers;

        var regionIndices: number[] = [];
        for (let i = 0; i < nrOfRegions; i++) {
            regionIndices.push(i);
        }

        this.shuffleList(regionIndices);

        for (let player of this.activePlayers) {
            var playerGE = player.gameExtension as RiskPlayerExtension;
            for (let i = 0; i < regionsPerPlayer; i++) {
                playerGE.addRegion(this.map.regions[regionIndices.pop()], player);
            }
        }

        // neutral regions
        //console.log(regionIndices.length, regionIndices);
        for (let index of regionIndices) {
            this.map.regions[index].troops = 3;
        }

        // Setup playerGE
        for (let i = 0; i < this.activePlayers.length; i++) {
            const playerGE = this.activePlayers[i].gameExtension as RiskPlayerExtension;
            playerGE.team = i;
            playerGE.reinforcements = startingUnits;
        }

        this.turn = 0;
        this.phase = 0;
        this.currentPlayer = this.getRandomActivePlayer();
    }

    private isValidAction(player: Player, data: IIncommingData) {
        const PGE = player.gameExtension as RiskPlayerExtension;

        if (!data.action) {
            console.log("Risk - validate: No action defined.");
            return false;
        }

        // Delete after the check is implemented somewhere else!!!
        // Turn 0: Everyone just reinforces their regions
        /*
        if (this.turn < this.activePlayers.length) {
            if (data.action !== "reinforce") {
                console.log("Risk - validate: Only reinforcements are allowed in first turn.");
                return false;
            }
        }
        */

        if (data.action === "endPhase") {
            if (this.phase === 0) {
                if (PGE.reinforcements <= 0) {
                    return true;
                }
                else {
                    console.log("Risk - validate: You have to use all your reinforcements.");
                }
            }
            else if (this.phase === 1) {
                return true;
            }
            else if (this.phase === 2) {
                return true;
            }
        }
        else if (data.targetRegion) {
            const targetRegion = this.map.getRegionById(data.targetRegion);
            if (targetRegion) {
                if (data.unitCount) {
                    if (data.action === "reinforce" && this.phase === 0) {
                        if (targetRegion.owner === player) {
                            if (data.unitCount > 0 && data.unitCount <= PGE.reinforcements) {
                                return true;
                            }
                            else {
                                console.log("Risk - validate: Invalid unit count.");
                            }
                        }
                        else {
                            console.log("Risk - validate: The target region is not yours.");
                        }
                    }
                    else if (data.action === "attack" && this.phase === 1) {
                        if (targetRegion.owner !== player) {
                            if (data.sourceRegion) {
                                const sourceRegion = this.map.getRegionById(data.sourceRegion);
                                if (sourceRegion) {
                                    if (sourceRegion.owner === player) {
                                        if (targetRegion.isNeighbour(sourceRegion)) {
                                            if (data.unitCount > 0 && data.unitCount < sourceRegion.troops) {
                                                return true;
                                            }
                                            else {
                                                console.log("Risk - validate: Invalid unit count.");
                                            }
                                        }
                                        else {
                                            console.log("Risk - validate: You can only attack adjacent regions.");
                                        }
                                    }
                                    else {
                                        console.log("Risk - validate: Source region is not yours.");
                                    }
                                }
                                else {
                                    console.log("Risk - validate: Invalid source region index.");
                                }
                            }
                            else {
                                console.log("Risk - validate: Source region not defined.");
                            }
                        }
                        else {
                            console.log("Risk - validate: Target region is yours.");
                        }
                    }
                    else if (data.action === "move" && this.phase === 2) {
                        if (targetRegion.owner === player) {
                            if (data.sourceRegion) {
                                const sourceRegion = this.map.getRegionById(data.sourceRegion);
                                if (sourceRegion) {
                                    if (sourceRegion.owner === player) {
                                        if (targetRegion.isNeighbour(sourceRegion)) {
                                            if (data.unitCount > 0 && data.unitCount < sourceRegion.troops) {
                                                return true;
                                            }
                                            else {
                                                console.log("Risk - validate: Invalid unit count.");
                                            }
                                        }
                                        else {
                                            console.log("Risk - validate: You can move your troops only to a adjacent region.");
                                        }
                                    }
                                    else {
                                        console.log("Risk - validate: Source region is not yours.");
                                    }
                                }
                                else {
                                    console.log("Risk - validate: Invalid source region index.");
                                }
                            }
                            else {
                                console.log("Risk - validate: Source region not defined.");
                            }
                        }
                        else {
                            console.log("Risk - validate: Target region is not yours.");
                        }
                    }
                }
                else {
                    console.log("Risk - validate: Unit count not defined.");
                }
            }
            else {
                console.log("Risk - validate: Invalid target region index.");
            }
        }
        else {
            console.log("Risk - validate: Target region not defined.");
        }

        return false;
    }

    private applyAction(player: Player, data: IIncommingData) {
        const PGE = player.gameExtension as RiskPlayerExtension;

        if (data.action === "endPhase") {
            this.endPhase();
        }
        else if (data.action === "reinforce") {
            const targetRegion = this.map.getRegionById(data.targetRegion);
            targetRegion.troops += data.unitCount;
            PGE.reinforcements -= data.unitCount;

            if (PGE.reinforcements <= 0) {
                this.endPhase();
            }
        }
        else if (data.action === "attack") {
            const targetRegion = this.map.getRegionById(data.targetRegion);
            const sourceRegion = this.map.getRegionById(data.sourceRegion);
            const targetPlayer = targetRegion.owner;
            const targetPlayerGE = targetPlayer.gameExtension as RiskPlayerExtension;

            PGE.attackRegion(sourceRegion, targetRegion, data.unitCount);

            // Check if a player lost all his regions
            if (targetPlayerGE.regions.length === 0) {
                this.playerFinished(targetPlayer);
            }
        }
        else if (data.action === "move") {
            const targetRegion = this.map.getRegionById(data.targetRegion);
            const sourceRegion = this.map.getRegionById(data.sourceRegion);

            PGE.moveTroops(sourceRegion, targetRegion, data.unitCount);
        }
    }

    private endPhase() {
        var playerGE = this.currentPlayer.gameExtension as RiskPlayerExtension;
        if (this.phase === 0) {
            if (!playerGE.hasPlacedInitialReinforcements) {
                this.endTurn();
            }
            else {
                this.phase = 1;
            }
        }
        else if (this.phase === 1) {
            this.phase = 2;
        }
        else if (this.phase === 2) {
            this.endTurn();
        }
    }

    protected endTurn() {
        if (this.activePlayers.length === 1) {
            // Game over
            this.playerFinished(this.activePlayers[0]);
        }
        else {
            const lastPlayer = this.currentPlayer;
            const lastPlayerExtension = lastPlayer.gameExtension as RiskPlayerExtension;

            lastPlayerExtension.endTurn();
            this.turn++;

            for (let i = 0; i < this.activePlayers.length; i++) {
                if (this.activePlayers[i] === lastPlayer) {
                    this.currentPlayer = this.activePlayers[this.activePlayers.length > (i + 1) ? (i + 1) : 0];
                    break;
                }
            }

            const playerGE = this.currentPlayer.gameExtension as RiskPlayerExtension;
            if (playerGE.hasPlacedInitialReinforcements) {
                playerGE.getReinforcements(this.reinforcements);
            }
            else {
                playerGE.hasPlacedInitialReinforcements = true;
            }

            this.phase = 0;
            this.checkForTurnNotifications();
        }
    }

    protected onGameOver(data = {}) {
        data = {
            winner: this.finishedPlayers[this.finishedPlayers.length - 1]
        }

        super.onGameOver(data);
    }

    protected toInitialJson(): IRiskGameState {
        const playerInfo: any = {};
        for (let player of this.players) {
            playerInfo[player.user.id] = {
                name: player.user.name,
                color: "white"
            }
        }

        return {
            options: {
            },
            mapData: this.map.mapData,
            playerInfo: playerInfo
        };
    }

    protected toJson(): IRiskGameState {
        const regions: any = {};
        for (let region of this.map.regions) {
            regions[region.id] = {
                name: region.name,
                owner: region.owner.user.id,
                troops: region.troops
            }
        }
        
        return {
            players: this.players.map((player) => player.toJson()),
            currentPlayer: this.currentPlayer.user.id,
            turn: this.turn,
            phase: this.phase,
            nextReinforcementWave: this.reinforcements.getNextQuntity(),
            regions: regions,
            isOver: this.isOver
        };
    }

    public isActionRequired(user: User) {
        return this.currentPlayer.user == user;
    }

    public onTimerUpdate(dt: number) {
        
    }

    public onGameAction(user: User, data: IIncommingData) {
        const player = this.getPlayerByUser(user) as Player;
        if (this.isPlayersTurn(player)) {
            if (this.isValidAction(player, data)) {
                this.applyAction(player, data);
                const that = this;
                this.ioEmitter.toEach(function (player: Player) { return { player: player.toPrivateJson(), game: that.toJson() } });
            }
            else {
                console.log("Invalid turn.");
            }
        }
        else {
            console.log("Not your turn!");
        }
    }

    // static information
    public static displayName = "Risk";
    public static label = "risk";

    public static availability = Role.Dev;

    public static settings = new Settings([
    ]);

    public static lobby = {
        minUser: 3,
        maxUser: 6,
        teams: {
            count: 0,
            minPlayers: 0,
            maxPlayers: 0,
            required: false
        }
    };

    public static prerequisites(nrOfPlayers: number) {
        return nrOfPlayers >= RiskGame.lobby.minUser && nrOfPlayers <= RiskGame.lobby.maxUser;
    }

    // getter for static variables
    public getDisplayName() {
        return RiskGame.displayName;
    }

    public getLabel() {
        return RiskGame.label;
    }

    public getSettings() {
        return RiskGame.settings;
    }

    public getLobbyInfo() {
        return RiskGame.lobby;
    }
}

// TODO: JSON data interfaces
interface IRiskGameState extends IGameState {
    
}

interface IIncommingData {
    action: "reinforce" | "attack" | "move" | "endPhase",
    targetRegion: number,
    sourceRegion: number,
    unitCount: number
}