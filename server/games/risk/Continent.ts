import { Region } from "./Region";

export class Continent {

    public id: number;
    public name: string;

    public bonusArmies: number;

    public regions: Region[] = [];

    public constructor(id: number, name: string, bonusArmies: number) {
        this.id = id;
        this.name = name;
        this.bonusArmies = bonusArmies;
    }

    public addRegion(region: Region) {
        this.regions.push(region);
    }
}