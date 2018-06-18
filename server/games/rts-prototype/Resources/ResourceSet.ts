export class ResourceSet {
    private wood: number;
    private stone: number;
    private iron: number;
    
    public constructor({wood = 0, stone = 0, iron = 0}: {wood?: number, stone?: number, iron?: number}) {
        this.wood = wood;
        this.stone = stone;
        this.iron = iron;
    }

    public spend(resources: ResourceSet) {
        this.minus(resources);
    }

    public add(resources: ResourceSet) {
        this.plus(resources);
    }

    public hasEnough(resources: ResourceSet) {
        return this.wood >= resources.wood
            && this.stone >= resources.stone
            && this.iron >= resources.iron;
    }

    public copyAndMultiply(multiplier: number) {
        var resourceSetCopy = this.copy();
        resourceSetCopy.times(multiplier);

        return resourceSetCopy;
    }

    private copy() {
        return new ResourceSet({ wood: this.wood, stone: this.stone, iron: this.iron });
    }

    private minus(resources: ResourceSet) {
        this.wood -= resources.wood;
        this.stone -= resources.stone;
        this.iron -= resources.iron;
    }

    private plus(resources: ResourceSet) {
        this.wood += resources.wood;
        this.stone += resources.stone;
        this.iron += resources.iron;
    }

    private times(nr: number) {
        this.wood *= nr;
        this.stone *= nr;
        this.iron *= nr;
    }

    public toJSON() {
        return {
            wood: this.wood,
            stone: this.stone,
            iron: this.iron
        }
    }
}