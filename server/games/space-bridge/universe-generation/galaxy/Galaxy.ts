import { Star } from "../star/Star";

export abstract class Galaxy {

    protected sizeX: number;
    protected sizeY: number;
    protected sizeZ: number;

    protected density: number;

    protected starCount: number;
    protected stars: Star[] = [];

    public constructor(sizeX: number, sizeY: number, sizeZ: number, density: number) {
        this.sizeX = sizeX;
        this.sizeY = sizeY;
        this.sizeZ = sizeZ;

        this.density = density;

        this.starCount = Math.floor(Math.sqrt(this.sizeX * this.sizeY * this.sizeZ) * density);
    }
}