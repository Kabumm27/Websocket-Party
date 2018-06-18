import { Game, TimerType, IOutgoingData, IGameState } from "../base/Game";
import { Player } from "../base/Player";
import { User } from "../../User";
import { IoEmitter } from "../base/IoEmitter";
import { Settings, SettingsValue, SettingsItemInteger, SettingsItemBoolean, SettingsItemSelection } from "../base/game-settings/";
import { GamesManager } from "../../GamesManager";

import { MauMauPlayerExtension } from "./MauMauPlayerExtension";
import { MauMauHistoryItem } from "./MauMauHistoryItem";
import Deck from "./Deck";
import Card from "./Card";

export class MauMauGame extends Game {

    private drawingDeck: Deck;
    private playingDeck: Deck;

    private cardsToDraw: number;

    private drawAndPlay: boolean;
    private totalTurnTime: number;
    private currentTurnTime: number;

    private currentPlayer: Player;
    private turn: number;


    public constructor(id: string, name: string, users: User[], teams: number[], io: SocketIO.Server, gamesManager: GamesManager, settings: SettingsValue[]) {
        super(id, name, users, teams, io, gamesManager, settings);

        for (var i = 0; i < this.players.length; i++) {
            this.players[i].gameExtension = new MauMauPlayerExtension();
        }

        this.init();
    }
    
    protected applySettings(settings: SettingsValue[]) {
        // Turntimer
        var turnTimerOption = settings[0] as number;
        if (turnTimerOption === 0) {
            this.timerType = TimerType.disabled;
        }
        else {
            this.timerType = TimerType.turnTimer;
        }
        this.totalTurnTime = turnTimerOption * 1000;
        this.currentTurnTime = this.totalTurnTime;

        // Draw and play
        var drawAndPlay = settings[1] as boolean;
        this.drawAndPlay = drawAndPlay;

    }

    protected setupStats() {
        this.stats.set("cardsPlayed", 0);
        this.stats.set("cardsDrawn", 0);

        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            player.stats.set("cardsPlayed", 0);
            player.stats.set("cardsDrawn", 0);
            player.stats.set("turnsSkipped", 0);
        }
    }

    public reset() {
        super.reset();
        this.setup();   
    }

    protected init() {
        this.setup();
    }

    private setup() {
        this.turn = 0;

        this.drawingDeck = new Deck();
        this.drawingDeck.createCards();
        this.drawingDeck.shuffle();

        this.dealCards(5);

        this.playingDeck = new Deck();
        this.playingDeck.playCard(this.drawingDeck.drawCard());

        this.playingDeck.first().turnPlayed = -1;
        this.cardsToDraw = this.playingDeck.first().isTake2Card() ? 2 : 0;

        this.currentPlayer = this.getRandomActivePlayer();
    }

    private isValidMove(player: Player, data: IIncommingData) {
        if (!this.isPlayersTurn(player)) return false;

        var playerExtension = player.gameExtension as MauMauPlayerExtension;
        var type = data.type as string;
        var turn = this.turn + (playerExtension.cardDrawn ? 1 : 0);
        var topCard = this.playingDeck.first();
        var skip = !playerExtension.cardPlayed && topCard.playedLastTurn(this.turn) && topCard.isSkipCard();
        var noCardPlayable = playerExtension.cards.every( (card) => !card.isPlayable(topCard, turn) );

        if (type === "playCard") {
            if (data.card && data.card.suit && data.card.rank) {
                if (playerExtension.hasCard(data.card.suit, data.card.rank)) {
                    var card = new Card(data.card.suit, data.card.rank);
                    return card.isPlayable(topCard, turn) && (!playerExtension.cardDrawn || this.drawAndPlay) && !playerExtension.cardPlayed && !playerExtension.wishSuit;
                }
                else {
                    console.log("Error: MauMau -> isValidMove 0x0001a");
                    return false;
                }
            }
            else {
                console.log("Error: MauMau -> isValidMove 0x0001");
                return false;
            }
        }
        else if (type === "drawCard") {
            return !playerExtension.cardDrawn && !playerExtension.cardPlayed && !playerExtension.wishSuit && !skip && (!this.drawingDeck.empty() || this.playingDeck.count() > 1);
            //return noCardPlayable && !playerGameExtension.cardDrawn && !playerGameExtension.cardPlayed && !playerGameExtension.wishSuit && !skip;
        }
        else if (type === "wishSuit") {
            if (data.wishedSuit === "Clubs" || data.wishedSuit === "Spades" || data.wishedSuit === "Hearts" || data.wishedSuit === "Diamonds") {
                return playerExtension.wishSuit;
            }
            else {
                console.log("Error: MauMau -> isValidMove 0x0002");
                return false;
            }
        }
        else if (type === "endTurn") {
            return !playerExtension.wishSuit && (playerExtension.cardPlayed || playerExtension.cardDrawn || skip); //(skip && noCardPlayable));
        }
        else {
            return false;
        }
    }

    private applyMove(player: Player, data: IIncommingData) {
        var type = data.type as string;
        var playerGameExtension = player.gameExtension as MauMauPlayerExtension;

        if (type === "playCard") {
            if (data.card && data.card.suit && data.card.rank) {
                var cardInfo = data.card;
                let card = playerGameExtension.playCard(cardInfo.suit, cardInfo.rank, this.turn);

                if (card !== null) {
                    this.playingDeck.playCard(card);

                    if (card.isWishCard()) {
                        playerGameExtension.wishSuit = true;
                    }
                    else if (card.isTake2Card()) {
                        this.cardsToDraw += 2;
                    }

                    this.stats.add("cardsPlayed", 1);
                    this.currentPlayer.stats.add("cardsPlayed", 1);
                    // this.history.add(new MauMauHistoryItem(this.turn, this.currentPlayer.user.name + " played " + card.suit + " " + card.rank));
                    this.history.log(this.currentPlayer.user.name + " played " + card.suit + " " + card.rank, {
                        "turn": this.turn,
                        "action": type,
                        "user": this.currentPlayer.user.name,
                        "card": {
                            "suit": card.suit,
                            "rank": card.rank
                        }
                    });
                }
                else {
                    console.log("Error: MauMau -> applyMove 0x0001");
                }
            }
            else {
                console.log("Error: MauMau -> applyMove 0x0001a");
            }
        }
        else if (type === "drawCard") {
            if (this.cardsToDraw === 0) this.cardsToDraw = 1;
	
            // Check: if enough cards
            if (this.drawingDeck.count() <= this.cardsToDraw) {
                var playingDeckTopCard = this.playingDeck.drawCard();
                this.playingDeck.shuffle();
                this.drawingDeck.addDeck(this.playingDeck);
                this.playingDeck.playCard(playingDeckTopCard);
            }
		
            // if still not enough cards
            if (this.drawingDeck.count() <= this.cardsToDraw) {
                this.cardsToDraw = this.drawingDeck.count();

                //console.log("No more cards to draw!");
            }

            for (var i = 0; i < this.cardsToDraw; i++) {
                let card = this.drawingDeck.drawCard();
                playerGameExtension.cards.push(card);
            }

            this.stats.add("cardsDrawn", this.cardsToDraw);
            this.currentPlayer.stats.add("cardsDrawn", this.cardsToDraw);
            // this.history.add(new MauMauHistoryItem(this.turn, this.currentPlayer.user.name + " draw " + this.cardsToDraw + " card" + (this.cardsToDraw === 1 ? "" : "s")));
            this.history.log(this.currentPlayer.user.name + " draw " + this.cardsToDraw + " card" + (this.cardsToDraw === 1 ? "" : "s"), {
                "turn": this.turn,
                "action": type,
                "user": this.currentPlayer.user.name,
                "nrOfCards": this.cardsToDraw
            });


            this.cardsToDraw = 0;
            playerGameExtension.cardDrawn = true;
        }
        else if (type === "wishSuit") {
            this.playingDeck.first().wishedSuit = data.wishedSuit;
            playerGameExtension.wishSuit = false;

            // this.history.add(new MauMauHistoryItem(this.turn, this.currentPlayer.user.name + " wished for " + (data.wishedSuit ? data.wishedSuit : "anything")));
            this.history.log(this.currentPlayer.user.name + " wished for " + (data.wishedSuit ? data.wishedSuit : "anything"), {
                "turn": this.turn,
                "action": type,
                "user": this.currentPlayer.user.name,
                "wishedSuit": data.wishedSuit
            });
        }
        else if (type === "endTurn") {
            if (!playerGameExtension.cardDrawn && !playerGameExtension.cardPlayed) {
                this.currentPlayer.stats.add("turnsSkipped", 1);
            }

            this.endTurn();
        }
    }

    protected endTurn() {
        var lastPlayer = this.currentPlayer;
        var lastPlayerExtension = lastPlayer.gameExtension as MauMauPlayerExtension;

        lastPlayerExtension.endTurn();
        this.turn++;

        for (var i = 0; i < this.activePlayers.length; i++) {
            if (this.activePlayers[i] === lastPlayer) {
                this.currentPlayer = this.activePlayers[this.activePlayers.length > (i + 1) ? (i + 1) : 0];
                break;
            }
        }

        if (lastPlayerExtension.cards.length === 0) {
            this.playerFinished(lastPlayer);
        }

        if (this.activePlayers.length === 1) {
            this.playerFinished(this.activePlayers[0]);
        }

        this.currentTurnTime = this.totalTurnTime;
        this.checkForTurnNotifications();
    }

    private playerTimedOut() {
        if (!this.isValidMove(this.currentPlayer, <IIncommingData>{ type: "endTurn" })) {
            this.applyMove(this.currentPlayer, <IIncommingData>{ type: "drawCard" });
        }

        this.endTurn();
    }

    private dealCards(nr: number) {
        for (var i = 0; i < this.activePlayers.length * nr; i++) {
            var playerGameExtension = this.activePlayers[i % this.activePlayers.length].gameExtension as MauMauPlayerExtension;
            playerGameExtension.takeCard(this.drawingDeck.drawCard());
        }
    }

    public isActionRequired(user: User) {
        return this.currentPlayer.user === user;
    }

    protected isPlayersTurn(player: Player) {
        return this.isActionRequired(player.user);
    }

    protected toInitialJson(): IMauMauGameState {
        var playerNames: any = {};

        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            playerNames[player.user.id] = player.user.name;
        }

        return {
            options: {
                drawAndPlay: this.drawAndPlay,
                totalTurnTimer: this.totalTurnTime
            },
            playerNames: playerNames
        };
    }

    protected toJson(): IMauMauGameState {
        // # of cards per player
        var players = this.activePlayers.map(function (p) {
            var playerGameExtension = p.gameExtension as MauMauPlayerExtension;
            return { socketId: p.user.id, name: p.user.name, cardsNr: playerGameExtension.cards.length };
        });

        return {
            currentTurnTime: this.currentTurnTime,
            currentPlayer: this.currentPlayer.user.id,
            players: this.activePlayers.map((player) => player.toJson()),
            drawingStack: {
                cardsCount: this.drawingDeck.count()
            },
            playingStack: {
                cardsCount: this.playingDeck.count(),
                topCard: this.playingDeck.first()
            },
            turn: this.turn,
            cardsToDraw: this.cardsToDraw,
            gameOver: this.isOver
        };
    }

    public onTimerUpdate(dt: number) {
        //console.log(Date.now(), dt);
        this.currentTurnTime -= dt;

        if (this.currentTurnTime <= 0) {
            var that = this;
            this.playerTimedOut();

            this.ioEmitter.toEach(function (player: Player) { return { player: player.toPrivateJson(), game: that.toJson() } });
        }
    }

    public onGameAction(user: User, data: IIncommingData) {
        var action = data.action as string;

        if (action === "takeTurn") {
            var player = this.getPlayerByUser(user) as Player;
            if (this.isPlayersTurn(player)) {
                if (this.isValidMove(player, data)) {
                    this.applyMove(player, data);
                    var that = this;
                    this.ioEmitter.toEach(function (player: Player) { return { player: player.toPrivateJson(), game: that.toJson() } });
                }
                else {
                    console.log("Invalid turn.");
                }
            }
            else {
                console.log("Not your turn!");
            }
        }
    }

    // static information
    public static displayName = "Mau Mau";
    public static label = "mauMau";

    public static settings = new Settings([
        new SettingsItemInteger("Turntime", 0, 3600 * 48, 5, 60, "Seconds"),
        new SettingsItemBoolean("Draw and play", true)
    ]);

    public static lobby = {
        minUser: 2,
        maxUser: 5,
        teams: {
            count: 0,
            minPlayers: 0,
            maxPlayers: 0,
            required: false
        }
    };

    public static prerequisites(nrOfPlayers: number) {
        return nrOfPlayers >= MauMauGame.lobby.minUser && nrOfPlayers <= MauMauGame.lobby.maxUser;
    }

    // getter for static variables
    public getDisplayName() {
        return MauMauGame.displayName;
    }

    public getLabel() {
        return MauMauGame.label;
    }

    public getSettings() {
        return MauMauGame.settings;
    }

    public getLobbyInfo() {
        return MauMauGame.lobby;
    }
}

// TODO: JSON data interfaces
interface IMauMauGameState extends IGameState {
    
}

interface IIncommingData {
    action: string,
    type: string,
    card: {
        suit: string,
        rank: string
    },
    wishedSuit: string
}