declare module MapData {

    export interface Center {
        x: number;
        y: number;
    }

    export interface Country {
        name: string;
        path: string;
        center: Center;
    }

    export interface Map {
        name: string;
        stroke: string;
        fill: string;
        countries: Country[];
    }

    export interface Link {
        country1: string;
        country2: string;
    }

    export interface RootObject {
        map: Map[];
        links: Link[];
    }

}

