import { SpaceBridgePlayerExtension } from "../SpaceBridgePlayerExtension";
import { SpaceShip } from "../SpaceShip";

export class CrewMember {
    protected player: SpaceBridgePlayerExtension;
    protected ship: SpaceShip;

    public constructor(player: SpaceBridgePlayerExtension, ship: SpaceShip) {
        this.player = player;
        this.ship = ship;
    }
}