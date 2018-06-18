import { Vector3 } from "../utils/Vector3";
import { SpaceBridgePlayerExtension } from "../SpaceBridgePlayerExtension";
import { SpaceShip } from "../SpaceShip";
import { CrewMember } from "./CrewMember";

export class Pilot extends CrewMember {

    private maxSpeed: number;
    private currentSpeed: number;

    private position: Vector3;
    private direction: Vector3;


    public constructor(player: SpaceBridgePlayerExtension, ship: SpaceShip) {
        super(player, ship);
    }

    public setShipSpeed(speed: number) {
        this.ship.setSpeed(speed);
    }
}