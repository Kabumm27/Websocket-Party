export class Vector3 {

    private x: number;
    private y: number;
    private z: number;


    public constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public length() {
        const x2 = Math.pow(this.x, 2);
        const y2 = Math.pow(this.y, 2);
        const z2 = Math.pow(this.z, 2);

        return Math.sqrt(x2 + y2 + z2);
    }

    public norm() {
        const multi = 1 / this.length();

        return this.times(multi);
    }

    public times(multi: number) {
        const x = this.x * multi;
        const y = this.y * multi;
        const z = this.z * multi;

        return new Vector3(x, y, z);
    }

    public add(v: Vector3) {
        const x = this.x + v.x;
        const y = this.y + v.y;
        const z = this.z + v.z;

        return new Vector3(x, y, z);
    }

    public distance(v: Vector3) {
        return Math.sqrt(Math.pow(this.x - v.x, 2) + Math.pow(this.y - v.y, 2) + Math.pow(this.z - v.z, 2));
    }

    public toJson() {
        return {
            x: this.x,
            y: this.y,
            z: this.z
        }
    }
}