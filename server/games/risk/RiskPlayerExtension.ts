import { Player } from "../base/Player";
import { PlayerGameExtension } from "../base/PlayerGameExtension";
import { ReinforcementManager } from "./ReinforcementManager";
import { Continent } from "./Continent";
import { Region } from "./Region";

export class RiskPlayerExtension extends PlayerGameExtension {

    public regions: Region[] = [];
    public reinforcements: number;
    public reinforcementCards: number[] = [0, 0, 0];

    public hasPlacedInitialReinforcements: boolean = false;

    public team: number;

    public constructor() {
        super();

        this.reset();
    }

    public reset() {
        this.endTurn();
    }

    public endTurn() {
    }

    public addRegion(region: Region, player: Player) {
        region.owner = player;
        this.regions.push(region);
    }

    public moveTroops(sourceRegion: Region, targetRegion: Region, count: number) {
        sourceRegion.troops -= count;
        targetRegion.troops += count;
    }

    public attackRegion(sourceRegion: Region, targetRegion: Region, attackers: number) {
        // Fight!
        // Version 1: 1 unit kills 1 unit, defender wins with a draw
        var defenders = targetRegion.troops;

        if (defenders > attackers) {
            targetRegion.troops -= attackers;
        }
        else if (defenders === attackers) {
            targetRegion.troops = 1;
        }
        else {
            targetRegion.troops = attackers - targetRegion.troops;
            targetRegion.owner = sourceRegion.owner;
        }

        sourceRegion.troops -= attackers;
    }

    public getReinforcements(reinforcements: ReinforcementManager) {
        const reinforcementsForCards = reinforcements.getReinforcementsWithCards(this.reinforcementCards);
        const calculatedReinforcements = this.calculateReinforcements();

        this.reinforcements = calculatedReinforcements + reinforcementsForCards;
    }

    private calculateReinforcements() {
        const reinforcementsForRegions = Math.floor(this.regions.length / 3);

        // Get bonus armies from continents
        let reinforcementsForContinents = 0;
        const player = this.regions.length > 0 ? this.regions[0].owner : null;

        const occupiedContinents: any = {};
        for (let region of this.regions) {
            occupiedContinents[region.continent.id] = region.continent;
        }

        for (let key in occupiedContinents) {
            const continent = occupiedContinents[key] as Continent;
            let playerOwnsAllRegion = true;
            for (let region of continent.regions) {
                if (region.owner !== player) {
                    playerOwnsAllRegion = false;
                    break;
                }
            }

            if (playerOwnsAllRegion) {
                reinforcementsForContinents += continent.bonusArmies;
            }
        }

        return reinforcementsForRegions + reinforcementsForContinents;
    }

    private countTotalTroops() {
        let troops = 0;
        for (let region of this.regions) {
            troops += region.troops;
        }

        return troops;
    }

    public toPrivateJson() {

        return {
            reinforcementCards: this.reinforcementCards,
            reinforcements: this.reinforcements
        };
    }

    public toJson() {
        return {
            //regions: this.regions.map(region => region.id),
            //planedReinforcements: this.calculateReinforcements(),
            //troopsTotal: this.countTotalTroops()
        };
    }
}