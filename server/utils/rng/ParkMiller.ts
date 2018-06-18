import { IRNG } from "./Random";

export class ParkMiller implements IRNG {

    private seed: number;

    public constructor(seed: number) {
        this.seed = seed;
    }

    public random() {
        var hi = 16807 * (this.seed >> 16);
        var lo = 16807 * (this.seed & 0xFFFF) + ((hi & 0x7FFF) << 16) + (hi >> 15);

        this.seed = (lo > 0x7FFFFFFF ? lo - 0x7FFFFFFF : lo);

        return this.seed / 2147483647;
    }
}