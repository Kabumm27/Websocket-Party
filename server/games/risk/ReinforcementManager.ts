export class ReinforcementManager {

    public index: number;
    public quantities: number[];

    private increasingReinforcements: boolean;

    public constructor() {
        this.index = 0;
        this.quantities = [4, 6, 8, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60];

        this.increasingReinforcements = true;
    }

    public getNextQuntity() {
        return this.quantities[this.index];
    }

    public getReinforcementsWithCards(cardsCounter: number[]) {
        let reinforcements = 0;

        if (cardsCounter.every((cardCounter) => cardCounter >= 1)) {
            reinforcements = 10;

            for (let counter of cardsCounter) {
                counter--;
            }
        }
        else {
            for (let i = 0; i < cardsCounter.length; i++) {
                if (cardsCounter[i] >= 3) {
                    reinforcements = 3 + (i * 2);
                    cardsCounter[i] -= 3;
                    break;
                }
            }
        }

        if (this.increasingReinforcements && reinforcements > 0) {
            reinforcements = this.quantities[this.index];
            this.index++;
        }

        return reinforcements;
    }
}