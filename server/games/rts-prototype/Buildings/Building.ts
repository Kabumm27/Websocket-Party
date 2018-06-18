import { ResourceSet } from "../resources/ResourceSet";

export class Building {
    public name: string;
    public production: ResourceSet;
    public level: number;

    private baseResourceCost: ResourceSet;
    private buildTime: number;

    constructor(name: string, baseResourceCost: ResourceSet, production: ResourceSet, buildTime: number) {
        this.name = name;
        this.production = production;
        this.baseResourceCost = baseResourceCost;
        this.buildTime = buildTime;

        this.level = 1;
    }

    public update(dt: number, now: number) {

    }

    public calculateCost() {
        return this.baseResourceCost;
    }

    public calculateBuildTime() {
        return this.buildTime;
    }

    public hasEqualType(building: Building) {
        return this.name === building.name;
    }

    public toJSON() {
        return {
            name: this.name,
            baseResourceCost: this.baseResourceCost.toJSON(),
            level: this.level,
            production: this.production.toJSON(),
            buildTime: this.buildTime
        }
    }
}

export enum BuildingType {
    Woodcutter,
    Stonemason,
    Ironmine,
    Barracks
}