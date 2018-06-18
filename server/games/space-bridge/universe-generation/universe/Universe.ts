import { Galaxy } from "../galaxy/Galaxy";
import { SphericalGalaxy } from "../galaxy/SphericalGalaxy";

export class Universe {

    private galaxy: Galaxy;

    public constructor() {
        this.galaxy = new SphericalGalaxy();
    }
}