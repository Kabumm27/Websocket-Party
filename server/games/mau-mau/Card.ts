export default class Card {
    
    public rank: string;
    public suit: string;
    public name: string;

    public turnPlayed: number;
    public wishedSuit: string;

    public constructor(suit: string, rank: string) {
        this.rank = rank;
        this.suit = suit;

        this.name = rank + " " + suit;
    }

    public isPlayable(topCard: Card, turn: number) {
        if (topCard.isWishCard()) {
            return !this.isWishCard() && (topCard.wishedSuit ? topCard.wishedSuit == this.suit : true);
        }
        else if (topCard.suit === this.suit || topCard.rank === this.rank) {
            if (topCard.isSkipCard() && topCard.playedLastTurn(turn)) {
                return topCard.rank === this.rank;
            }
            else if (topCard.isTake2Card() && topCard.playedLastTurn(turn)) {
                return topCard.rank === this.rank;
            }
            else {
                return true;
            }
        }
        else {
            if (this.isWishCard() && !(topCard.isSkipCard() && topCard.playedLastTurn(turn)) && !(topCard.isTake2Card() && topCard.playedLastTurn(turn))) {
                return !topCard.isWishCard();
            }
            else {
                return false;
            }
        }
    }

    public isSpecial() {
        return this.isTake2Card() || this.isSkipCard() || this.isWishCard();
    }

    public isTake2Card() {
        return this.rank === "7";
    }

    public isSkipCard() {
        return this.rank === "8";
    }

    public isWishCard() {
        return this.rank === "B";
    }

    public playedLastTurn(turn: number) {
        return (this.turnPlayed + 1) === turn;
    }
}