import { PlayerResourceManager } from "../resources/PlayerResourceManager";
import { BaseBuildingsManager } from "../buildings/BaseBuildingsManager";
import { PlayerTechManager } from "../tech/PlayerTechManager";

import { Unit } from "./Unit";
import { UnitsData } from "./UnitsData";
import { UnitInTraining } from "./UnitInTraining";
import { ResourceSet } from "../Resources/ResourceSet";


export class BaseUnitManager {
    private playerResourceManager: PlayerResourceManager;
    private baseBuildingsManager: BaseBuildingsManager;
    private playerTech: PlayerTechManager;

    private units: Unit[] = [];
    private trainingsQueue: UnitInTraining[] = [];

    public constructor(resources: PlayerResourceManager, baseBuildings: BaseBuildingsManager, tech: PlayerTechManager) {
        this.playerResourceManager = resources;
        this.baseBuildingsManager = baseBuildings;
        this.playerTech = tech;
    }

    public train(unitName: string, count: number) {
        const unitData = UnitsData.getByName(unitName);

        if (unitData) {
            const unitCost = new ResourceSet(unitData.resourceCost);

            if (this.playerResourceManager.has(unitCost) && this.checkUnitRequirements(unitData.requiredBuildings)) {
                // Pay and add to trainigs queue
                this.playerResourceManager.spend(unitCost);
                const unit = new Unit(unitData.name, 1, unitData.stats.attack, unitData.stats.defense);
                const construction = new UnitInTraining(unit, count, Date.now(), this.calculateTrainTime(unit, unitData.buildTime), unitCost);
                this.trainingsQueue.push(construction);
            }
        }
    }

    private calculateTrainTime(unit: Unit, baseTrainTime: number) {
        return baseTrainTime;
    }

    private checkUnitRequirements(requirements: any) {
        for (let key in requirements) {
            if (this.baseBuildingsManager.getMaxBuildingLevel(key) < requirements[key]) {
                return false;
            }
        }

        return true;
    }

    private checkForFinishedTraining(now: number) {
        for (let i = 0; i < this.trainingsQueue.length; i++) {
            const training = this.trainingsQueue[i];
            const unit = this.getUnit(training.unit.name);
            while (training.lastUpdate + training.unitDuration <= now) {
                if (unit) {
                    unit.add(training.unit);
                }
                else {
                    this.units.push(training.unit);
                }
                training.lastUpdate += training.unitDuration;
                training.unitsLeft -= 1;
            }

            if (training.startTime + training.totalDuration <= now) {
                this.trainingsQueue.splice(i, 1);
                i--;
            }
        }
    }

    public getUnit(unitName: string) {
        for (let unit of this.units) {
            if (unit.name === unitName) {
                return unit;
            }
        }

        return null;
    }
}