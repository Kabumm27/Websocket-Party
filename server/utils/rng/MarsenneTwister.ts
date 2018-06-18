import { IRNG } from "./Random";

export class MarsenneTwister implements IRNG {
    private seed: number;

    private index: number;
    private state: number[];

    private size: number;
    private offset: number;

    public constructor(seed: number) {
        this.size = 624;
        this.offset = 397;

        this.index = 0;
        this.state = new Array(this.size);
        this.state[0] = seed !== null ? seed : (Math.random() * 0xFFFFFFFF) | 0;
        this.seed = this.state[0];

        const MT = this.state;
        for (let i = 1; i < this.size; i++) {
            MT[i] = MT[i - 1] ^ (MT[i - 1] >>> 30);
            MT[i] = 0x6C078965 * MT[i] + i; // 1812433253
            MT[i] = MT[i] & ((MT[i] << 32) - 1);
        }

        this.generateNumbers();
    }

    private generateNumbers() {
        let MT = this.state;
        for (let i = 0; i < this.size; i++) {
            // Bit 31 (32nd bit) of MT[i]
            let y = (MT[i] & 0x80000000)
            // Bits 0-30 (first 31 bits) of MT[...]
            y = y + (MT[(i + 1) % this.size] & 0x7FFFFFFF)
            // The new randomness
            MT[i] = MT[(i + this.offset) % this.size] ^ (y >>> 1)
            // In case y is odd
            if ((y % 2) !== 0) {
                MT[i] = MT[i] ^ 0x9908B0DF // 2567483615
            }
        }

        this.index = 0;
    }

    public random() {
        if (this.index === 0) {
            this.generateNumbers();
        }

        let y = this.state[this.index];
        y = y ^ (y >>> 11);
        y = y ^ ((y << 7) & 0x9D2C5680); // 2636928640
        y = y ^ ((y << 15) & 0xEFC60000); // 4022730752
        y = y ^ (y >>> 18);

        this.index += 1;

        return (y >>> 0) * (1.0 / 4294967296.0);
    }
}