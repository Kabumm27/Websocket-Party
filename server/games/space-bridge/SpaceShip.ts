import { Vector3 } from "./utils/Vector3";
import { SpaceBridgePlayerExtension } from "./SpaceBridgePlayerExtension";
import { Engineer } from "./crew/Engineer";
import { Gunner } from "./crew/Gunner";
import { Pilot } from "./crew/Pilot";
import { Scientist } from "./crew/Scientist";

export class SpaceShip {

    private position: Vector3;
    private direction: Vector3;

    private pilot: Pilot;
    private engineer: Engineer;
    private gunner: Gunner;
    private scientist: Scientist; // Optional?

    private speed: number;

    public constructor() {
        this.position = new Vector3(0, 0, 0);
        this.direction = new Vector3(0, 1, 0).norm();

        this.speed = 0;
    }

    public update(dt: number, now: number) {
        // Move ship
        this.position = this.position.add(this.direction.times(this.speed * dt));
    }

    public setCrew(pilot: Pilot, engineer: Engineer, gunner: Gunner, scientist: Scientist) {
        this.pilot = pilot;
        this.engineer = engineer;
        this.gunner = gunner;
        this.scientist = scientist;
    }

    public setSpeed(speed: number) {
        this.speed = speed;
    }

    public toJson() {
        return {
            speed: this.speed,
            position: this.position.toJson()
        }
    }
}