import { SpaceBridgePlayerExtension } from "../SpaceBridgePlayerExtension";
import { SpaceShip } from "../SpaceShip";
import { CrewMember } from "./CrewMember";

export class Gunner extends CrewMember {

    public constructor(player: SpaceBridgePlayerExtension, ship: SpaceShip) {
        super(player, ship);
    }
}