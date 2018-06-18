import { RTSPlayerExtension } from "./RTSPlayerExtension";
import { BaseBuildingsManager } from "./buildings/BaseBuildingsManager";
import { BaseUnitManager } from "./units/BaseUnitManager";
import { PlayerResourceManager } from "./resources/PlayerResourceManager";
import { PlayerTechManager } from "./tech/PlayerTechManager";
import { Building } from "./buildings/Building";

export class Base {
    private buildings: BaseBuildingsManager;
    private units: BaseUnitManager;

    private player: RTSPlayerExtension;
    private playerTech: PlayerTechManager;
    private playerResources: PlayerResourceManager;


    constructor(player: RTSPlayerExtension, playerResources: PlayerResourceManager, tech: PlayerTechManager) {
        this.player = player;
        this.playerResources = playerResources;
        this.playerTech = tech;

        this.buildings = new BaseBuildingsManager(this.playerResources, this.playerTech);
        this.units = new BaseUnitManager(this.playerResources, this.buildings, this.playerTech);
        

        this.buildings.build("woodcutter");
        this.buildings.build("stonemason");
    }

    public update(dt: number, now: number) {
        this.buildings.update(dt, now);
    }

    public toJSON() {
        return {
            buildings: this.buildings.toJSON()
        }
    }

    public toPublicJSON() {
        return {
        }
    }
}