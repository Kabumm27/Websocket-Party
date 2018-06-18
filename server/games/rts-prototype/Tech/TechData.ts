export module TechData {
    const data = [
        {
            "name": "better_lumberjacks",
            "resourceCost": {
                "wood": 50
            },
            "buildTime": 10,
            "requiredBuildings": {
                "woodcutter": 3
            },
            "requiredTech": {
            }
        }
    ];

    export function getAll() {
        return data;
    }

    export function getByName(name: string) {
        for (let tech of data) {
            if (tech.name === name) {
                return tech;
            }
        }

        return null;
    }
}