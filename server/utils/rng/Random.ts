import { MarsenneTwister } from "./MarsenneTwister";
import { ParkMiller } from "./ParkMiller";

export class Random {

    private seed: number;
    private prng: IRNG;

    private savedNormal: number;

    public constructor(seed: number = 472674, prng: PRNG = PRNG.MarsenneTwister) {
        this.seed = seed;

        if (prng === PRNG.MarsenneTwister) {
            this.prng = new MarsenneTwister(this.seed);
        }
        else if (prng === PRNG.ParkMiller) {
            this.prng = new ParkMiller(this.seed);
        }
        else {
            this.prng = Math;
        }
    }

    public uniform() {
        return this.prng.random();
    }

    public int(min: number, max: number) {
        if (max <= min) return null;

        return min + Math.floor(this.uniform() * (max - min))
    }

    public normallyDistributed() {
        if (this.savedNormal !== null) {
            var num = this.savedNormal;
            this.savedNormal = null;
            return num;
        }

        let x = this.uniform() || Math.pow(2, -53);
        x = Math.sqrt(-2 * Math.log(x));
        let y = 2 * Math.PI * this.uniform();

        this.savedNormal = x * Math.sin(y);
        return x * Math.cos(y);
    }
}

export interface IRNG {
    random(): number;
}

export enum PRNG {
    MarsenneTwister,
    ParkMiller,
    Math
}