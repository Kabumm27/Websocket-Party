import fs = require("fs");

import { Continent } from "./Continent";
import { Region } from "./Region";

export class Map {

    public mapData: MapData.RootObject;

    public continents: Continent[] = [];
    public regions: Region[] = [];

    constructor(name: string) {
        this.mapData = JSON.parse(fs.readFileSync("server/Games/Risk/" + name + ".json", "utf8"));

        // Create map from json
        for (let i = 0; i < this.mapData.map.length; i++) {
            const continentData = this.mapData.map[i];
            const continent = new Continent(i, continentData.name, continentData.bonusArmies);
            for (let regionData of continentData.countries) {
                const region = new Region(regionData.id, regionData.name, continent);
                this.regions.push(region);
                continent.addRegion(region);
            }
        }

        for (let i = 0; i < this.mapData.links.length; i++) {
            const link = this.mapData.links[i];
            const region1: Region = this.regions.filter(r => r.name === link.country1)[0];
            const region2: Region = this.regions.filter(r => r.name === link.country2)[0];

            region1.neighbours.push(region2);
            region2.neighbours.push(region1);
        }
    }

    public getRegionById(id: number) {
        for (let region of this.regions) {
            if (region.id === id) {
                return region;
            }
        }

        return null;
    }
}

export module MapData {
    export interface Center {
        x: number;
        y: number;
    }

    export interface Country {
        name: string;
        id: number;
        path: string;
        center: Center;
    }

    export interface Map {
        name: string;
        stroke: string;
        fill: string;
        bonusArmies: number;
        countries: Country[];
    }

    export interface Link {
        country1: string;
        country2: string;
    }

    export interface RootObject {
        map: Map[];
        links: Link[];
    }
}
