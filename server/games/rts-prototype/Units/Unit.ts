import { ResourceSet } from "../resources/ResourceSet";

export class Unit {
    public name: string;
    public count: number;

    public attack: number;
    public defense: number;


    public constructor(name: string, count: number, attack: number, defense: number) {

    }

    public add(unit: Unit) {
        this.count += unit.count;
    }

    public equal(unit: Unit) {
        return unit.name === this.name;
    }
}