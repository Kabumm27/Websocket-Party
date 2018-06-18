import { Player } from "../base/Player";
import { PlayerGameExtension } from "../base/PlayerGameExtension";

import { PlayerResourceManager } from "./resources/PlayerResourceManager";
import { PlayerTechManager } from "./tech/PlayerTechManager";
import { ResourceSet } from "./resources/ResourceSet";
import { Base } from "./Base";

export class RTSPlayerExtension extends PlayerGameExtension {
    private resources: PlayerResourceManager;
    private tech: PlayerTechManager;
    private bases: Base[] = [];

    public constructor() {
        super();

        this.reset();
    }

    public reset() {
        this.resources = new PlayerResourceManager();
        this.tech = new PlayerTechManager(this, this.resources);
        this.bases.push(new Base(this, this.resources, this.tech));
    }

    public update(dt: number, now: number) {
        for (var base of this.bases) {
            base.update(dt, now);
        }
    }

    public getAllUnits() {

    }

    public getAllBuildings() {

    }

    public toPrivateJson() {
        return {
            bases: this.bases.map((base) => base.toJSON()),
            resources: this.resources.toJSON()
        };
    }

    public toJson() {
        return {
        };
    }
}