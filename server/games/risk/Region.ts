import { Player } from "../base/Player";
import { Continent } from "./Continent";

export class Region {
    public id: number;
    public name: string;

    public neighbours: Region[];
    public continent: Continent;
    public troops: number;

    public owner: Player;

    constructor(id: number, name: string, continent: Continent) {
        this.id = id;
        this.name = name;
        this.continent = continent;

        this.neighbours = [];
        this.troops = 1;
        this.owner = null;
    }

    public isNeighbour(region: Region) {
        for (let neighbour of this.neighbours) {
            if (neighbour === region) {
                return true;
            }
        }

        return false;
    }

    /*
    hasEnoughTroops(troopsToMove: number): boolean {
        return this.troops > troopsToMove;
    }
    */

    /*
    attack(target: Region, nrOfTroops: number): void {
        this.troops -= nrOfTroops;

        if (target.troops < nrOfTroops) {
            target.troops = nrOfTroops - target.troops;

            // Delete region from previous owner
            if (target.owner !== null) {
                for (var i = 0; i < target.owner.regions.length; i++) {
                    var region = target.owner.regions[i];
                    if (region === target) {
                        target.owner.regions.splice(i, 1);
                    }
                }
            }
            // Set new owner
            target.owner = this.owner;
            this.owner.regions.push(target);
        } else {
            target.troops -= (nrOfTroops - 1);
        }
    }
    */
}