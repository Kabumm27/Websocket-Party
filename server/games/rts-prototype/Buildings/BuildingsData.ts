export module BuildingsData {
    const data = [
        {
            "name": "woodcutter",
            "resourceCost": {
                "wood": 50
            },
            "production": {
                "wood": 2
            },
            "buildTime": 20,
            "requiredBuildings": {
            },
            "requiredTech": {
            }
        },
        {
            "name": "stonemason",
            "resourceCost": {
                "wood": 100
            },
            "production": {
                "stone": 2
            },
            "buildTime": 20,
            "requiredBuildings": {
            },
            "requiredTech": {
            }
        },
        {
            "name": "ironmine",
            "resourceCost": {
                "wood": 100
            },
            "production": {
                "stone": 2
            },
            "buildTime": 20,
            "requiredBuildings": {
                "woodcutter": 2,
                "stonemason": 1
            },
            "requiredTech": {
            }
        },
        {
            "name": "barracks",
            "resourceCost": {
                "wood": 100,
                "stone": 100
            },
            "production": {
            },
            "buildTime": 20,
            "requiredBuildings": {
                "ironmine": 1
            },
            "requiredTech": {
            }
        }
    ];

    export function getAll() {
        return data;
    }

    export function getByName(name: string) {
        for (let building of data) {
            if (building.name === name) {
                return building;
            }
        }

        return null;
    }
}