import { PlayerGameExtension } from "../base/PlayerGameExtension";

import Card from "./Card";

export class MauMauPlayerExtension extends PlayerGameExtension {

    public cards: Card[] = [];

    public cardDrawn = false;
    public cardPlayed = false;
    public wishSuit = false;

    public constructor() {
        super();
    }

    public reset() {
        this.cards = [];
        this.endTurn();
    }

    public endTurn() {
        this.cardDrawn = false;
        this.cardPlayed = false;
        this.wishSuit = false;
    }

    public takeCard(card: Card) {
        this.cards.push(card);
    }

    public playCard(suit: string, rank: string, turn: number) {
        var card = this.getCard(suit, rank);
        card.turnPlayed = turn;
        this.removeCardFromHand(card);

        this.cardPlayed = true;

        return card;
    }

    private removeCardFromHand(card: Card) {
        for (var i = 0; i < this.cards.length; i++) {
            if (this.cards[i] === card) {
                this.cards.splice(i, 1);
                return true;
            }
        }
        return false;
    }

    public getCard(suit: string, rank: string) {
        for (var i = 0; i < this.cards.length; i++) {
            var card = this.cards[i];
            if (card.suit === suit && card.rank === rank) {
                return card;
            }
        }
        return null;
    }

    public hasCard(suit: string, rank: string) {
        return this.getCard(suit, rank) !== null;
    }

    public toPrivateJson() {
        return {
            wishSuit: this.wishSuit,
            cardPlayed: this.cardPlayed,
            cardDrawn: this.cardDrawn,
            cards: this.cards
        };
    }

    public toJson() {
        return {
            cardsNr: this.cards.length
        };
    }
}