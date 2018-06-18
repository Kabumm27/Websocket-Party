import { ResourceSet } from "./ResourceSet";

export class PlayerResourceManager {

    private resources: ResourceSet;

    public constructor() {
        this.resources = new ResourceSet({ wood: 1000, stone: 1000, iron: 1000 });
    }

    public gain(resources: ResourceSet) {
        this.resources.add(resources);
    }

    public spend(resources: ResourceSet) {
        this.spend(resources);
    }

    public has(resources: ResourceSet) {
        return this.resources.hasEnough(resources);
    }

    public toJSON() {
        return this.resources.toJSON();
    }
}