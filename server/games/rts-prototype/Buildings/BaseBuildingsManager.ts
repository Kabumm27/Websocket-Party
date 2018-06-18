import { PlayerResourceManager } from "../resources/PlayerResourceManager";
import { ResourceSet } from "../resources/ResourceSet";
import { PlayerTechManager } from "../tech/PlayerTechManager";

import { BuildingsData } from "./BuildingsData";
import { BuildingType, Building } from "./Building";
import { Construction } from "./Construction";

export class BaseBuildingsManager {
    private playerResourceManager: PlayerResourceManager;
    private playerTech: PlayerTechManager;

    private buildings: Building[] = [];
    private constructionQueue: Construction[] = [];

    public constructor(playerResourceManager: PlayerResourceManager, tech: PlayerTechManager) {
        this.playerResourceManager = playerResourceManager;
        this.playerTech = tech;
    }


    public update(dt: number, now: number) {
        this.checkForFinishedConstructions(now);

        this.playerResourceManager.gain(this.calculateResourceGain(dt));
    }

    public build(buildingName: string) {
        const buildingData = BuildingsData.getByName(buildingName);

        if (buildingData) {
            const buildingCost = new ResourceSet(buildingData.resourceCost);

            if (this.playerResourceManager.has(buildingCost) && this.checkBuildingRequirements(buildingData.requiredBuildings)) {
                // Pay and add to construction queue
                this.playerResourceManager.spend(buildingCost);
                const building = new Building(buildingData.name, buildingCost, new ResourceSet(buildingData.production), buildingData.buildTime);
                const construction = new Construction(null, building, Date.now(), building.calculateBuildTime());
                this.constructionQueue.push(construction);
            }
        }
    }

    private calculateResourceGain(dt: number) {
        var resources = new ResourceSet({});
        for (const building of this.buildings) {
            const prod = building.production;
            resources.add(prod.copyAndMultiply(dt));
        }

        return resources;
    }

    private checkForFinishedConstructions(now: number) {
        for (let i = 0; i < this.constructionQueue.length; i++) {
            const construction = this.constructionQueue[i];
            if (construction.startTime + construction.duration <= now) {
                const building = construction.building;
                this.buildings.push(building);
                this.playerTech.setBuildingLevel(building.name, building.level);
                this.constructionQueue.splice(i, 1);
                i--;
            }
        }
    }

    private checkBuildingRequirements(requirements: any) {
        for (let key in requirements) {
            if (this.getMaxBuildingLevel(key) < requirements[key]) {
                return false;
            }
        }

        return true;
    }

    public getMaxBuildingLevel(buildingName: string) {
        let maxLevel = 0;

        for (let building of this.buildings) {
            if (building.name === buildingName && building.level > maxLevel) {
                maxLevel = building.level;
            }
        }

        return maxLevel;
    }

    public toJSON() {
        return this.buildings.map((b) => b.toJSON());
    }
}