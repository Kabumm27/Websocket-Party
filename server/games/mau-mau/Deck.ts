import Card from "./Card";

export default class Deck {
    public cards: Card[] = [];

    public constructor() {

    }

    public createCards() {
        var ranks = ["7", "8", "9", "10", "B", "D", "K", "A"];
        var suits = ["Clubs", "Spades", "Hearts", "Diamonds"];

        for (var i = 0; i < suits.length; i++) {
            for (var j = 0; j < ranks.length; j++) {
                this.cards.push(new Card(suits[i], ranks[j]));
            }
        }
    }

    public shuffle () {
        var counter = this.cards.length;

        while (counter--) {
            var index = (Math.random() * counter) | 0;

            var temp = this.cards[counter];
            this.cards[counter] = this.cards[index];
            this.cards[index] = temp;
        }
    }

    public addDeck(deck: Deck) {
        this.cards = deck.cards.concat(this.cards);
        deck.cards = [];
    }

    public drawCard() {
        return this.cards.pop();
    }

    public playCard(card: Card) {
        this.cards.push(card);
    }

    public first() {
        var lastIndex = this.cards.length - 1;
        return this.cards[lastIndex];
    }

    public count() {
        return this.cards.length;
    }

    public empty() {
        return this.cards.length === 0;
    }
}