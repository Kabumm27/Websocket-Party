export module UnitsData {
    const data = [
        {
            "name": "swordman",
            "resourceCost": {
                "wood": 50
            },
            "stats": {
                "attack": 5,
                "defense": 10
            },
            "buildTime": 10,
            "requiredBuildings": {
                "barracks": 1
            },
            "requiredTech": {
            }
        },
        {
            "name": "archer",
            "resourceCost": {
                "wood": 100
            },
            "stats": {
                "attack": 8,
                "defense": 3
            },
            "buildTime": 5,
            "requiredBuildings": {
            },
            "requiredTech": {
            }
        }
    ];

    export function getAll() {
        return data;
    }

    export function getByName(name: string) {
        for (let unit of data) {
            if (unit.name === name) {
                return unit;
            }
        }

        return null;
    }
}