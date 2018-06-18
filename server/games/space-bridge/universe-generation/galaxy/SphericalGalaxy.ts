import { Galaxy } from "./Galaxy";
import { Star, StartType } from "../star/Star";
import { Random } from "../../../../utils/rng/Random";
import { Vector3 } from "../../utils/Vector3";

export class SphericalGalaxy extends Galaxy {

    private rng: Random;

    public constructor() {
        super(1000, 1000, 1000, 1);

        console.log(this.starCount);

        this.rng = new Random();

        this.generate();
    }

    private generate() {
        for (let i = 0; i < this.starCount; i++) {
            const x = this.rng.normallyDistributed() * this.sizeX - (this.sizeX / 2);
            const y = this.rng.normallyDistributed() * this.sizeY - (this.sizeY / 2);
            const z = this.rng.normallyDistributed() * this.sizeZ - (this.sizeZ / 2);
            this.stars.push(new Star(new Vector3(x, y, z), StartType.Yellow));
        }

        // Test stuff
        // min distance
        let min = 1000;
        for (let i = 0; i < this.starCount; i++) {
            const star = this.stars[i];
            for (let j = 0; j < this.starCount; j++) {
                if (i !== j) {
                    const otherStar = this.stars[j];
                    const dist = star.pos.distance(otherStar.pos);
                    if (dist < min) {
                        min = dist;
                    }
                }
            }
        }

        console.log("Min dist:", min);
    }
}