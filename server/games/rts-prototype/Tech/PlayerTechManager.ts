import { RTSPlayerExtension } from "../RTSPlayerExtension";
import { PlayerResourceManager } from "../resources/PlayerResourceManager";
import { TechData } from "./TechData";

export class PlayerTechManager {
    private player: RTSPlayerExtension;
    private resources: PlayerResourceManager;

    private buildingLevels: any = {};

    public constructor(player: RTSPlayerExtension, resources: PlayerResourceManager) {
        this.player = player;
        this.resources = resources;
    }

    public setBuildingLevel(buildingName: string, level: number) {
        if (this.buildingLevels[buildingName]) {
            if (this.buildingLevels[buildingName] < level) {
                this.buildingLevels[buildingName] = level;
            }
        }
        else {
            this.buildingLevels[buildingName] = level;
        }
    }
}