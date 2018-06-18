import { ResourceSet } from "../resources/ResourceSet";
import { Unit } from "./Unit";

export class UnitInTraining {
    public unit: Unit;

    public startTime: number;
    public lastUpdate: number;
    public totalDuration: number;
    public unitDuration: number;

    public cost: ResourceSet;

    public totalUnits: number;
    public unitsLeft: number;

    constructor(unit: Unit, count: number, startTime: number, unitDuration: number, cost: ResourceSet) {
        this.unit = unit;
        this.startTime = startTime;
        this.lastUpdate = startTime;
        this.unitDuration = unitDuration;
        this.totalDuration = unitDuration * unit.count;
        this.cost = cost;
        this.totalUnits = count;
        this.unitsLeft = count;
    }

}