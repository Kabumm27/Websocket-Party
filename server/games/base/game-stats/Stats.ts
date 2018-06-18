export class Stats {

    private values: any;

    public constructor() {
        this.values = {};
    }

    public set(key: string, value: any) {
        this.values[key] = value;
    }

    public get(key: string) {
        return this.values[key];
    }

    public add(key: string, value: number) {
        this.values[key] += value;
    }
}