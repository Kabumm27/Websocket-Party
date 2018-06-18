import { Vector3 } from "../../utils/Vector3";

export class Star {
    public pos: Vector3;
    public type: StartType;

    public constructor(v: Vector3, type: StartType) {
        this.pos = v;
        this.type = type;
    }
}

export enum StartType {
    Dead,
    Red,
    Yellow,
    White,
    Blue
}