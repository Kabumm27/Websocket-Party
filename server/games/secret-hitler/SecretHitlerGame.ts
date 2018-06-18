import { IOutgoingData, IGameState, TimerType, Game } from "../base/Game";
import { Player } from "../base/Player";
import { User } from "../../User";
import { IoEmitter } from "../base/IoEmitter";
import { Settings, SettingsValue, SettingsItemInteger, SettingsItemBoolean, SettingsItemSelection } from "../base/game-settings";
import { GamesManager } from "../../GamesManager";

import { SecretHitlerPlayerExtension } from "./SecretHitlerPlayerExtension";
import { SecretHitlerHistoryItem } from "./SecretHitlerHistoryItem";

export class SecretHitlerGame extends Game {
    private president: Player;
    private chancellor: Player;
    private lastPresident: Player;
    private lastChancellor: Player;

    private specialElectionPresident: Player;
    private nextInOrderPresident: Player;

    private policyDeck: number[] = [];
    private policyDiscard: number[] = [];

    private currentlySelectedPolicyCards: number[] = [];

    private voteCounter: number;
    private chancellorVetoed: boolean;
    private alreadyVetoed: boolean;
    private successfullVeto: boolean;

    private failedElections: number;
    private voteFailed: boolean;

    private nrOfFascistPolicies: number;
    private nrOfLiberalPolicies: number;
    private wasLastPolicyFascist: boolean;

    private phase: number;

    public constructor(id: string, name: string, users: User[], teams: number[], io: SocketIO.Server, gamesManager: GamesManager, settings: SettingsValue[]) {
        super(id, name, users, teams, io, gamesManager, settings);

        for (var i = 0; i < this.players.length; i++) {
            this.players[i].gameExtension = new SecretHitlerPlayerExtension();
        }

        this.init();
    }

    protected applySettings(settings: SettingsValue[]) {
        // settings
    }

    protected setupStats() {
        // stats
    }

    public reset() {
        super.reset();
        this.setup();   
    }

    protected init() {
        this.setup();
    }

    private setup() {
        var nrOfPlayers = this.players.length;
        var nrOfLiberals = Math.floor(nrOfPlayers / 2) + 1;
        var nrOfFascists = nrOfPlayers - (nrOfLiberals + 1);

        // Set roles
        var roles = [ "Hitler" ];
        for (var i = 0; i < nrOfLiberals; i++) {
            roles.push("Liberal");
        }
        for (var i = 0; i < nrOfFascists; i++) {
            roles.push("Fascist");
        }
        this.shuffleList(roles);

        var hitler: Player;
        var fascists: Player[] = [];

        for (var i = 0; i < nrOfPlayers; i++) {
            var playerGE = this.players[i].gameExtension as SecretHitlerPlayerExtension;
            playerGE.setRole(roles[i]);

            if (roles[i] === "Hitler") {
                hitler = this.players[i];
            }
            else if (roles[i] === "Fascist") {
                fascists.push(this.players[i]);
            }
        }

        // Fascists need to know each other
        if (nrOfPlayers <= 6) {
            fascists.push(hitler);
            for (var fascist of fascists) {
                var fascistGE = fascist.gameExtension as SecretHitlerPlayerExtension;
                fascistGE.setFascistsTeam(fascists);
            }
        }
        else {
            for (var fascist of fascists) {
                var fascistGE = fascist.gameExtension as SecretHitlerPlayerExtension;
                fascistGE.setFascistsTeam(fascists.concat([hitler]));
            }
        }

        this.policyDeck = [];
        for (var i = 0; i < 17; i++) {
            // i <  11 --> Fascist
            // i >= 11 --> Liberal
            this.policyDeck.push(i);
        }

        this.policyDiscard = [];

        this.nrOfFascistPolicies = 0;
        this.nrOfLiberalPolicies = 0;
        this.voteCounter = 0;
        this.chancellorVetoed = false;
        this.alreadyVetoed = false;
        this.failedElections = 0;
        this.voteFailed = false;
        this.successfullVeto = false;

        this.shuffleList(this.policyDeck);

        this.lastPresident = null;
        this.lastChancellor = null;
        this.specialElectionPresident = null;
        this.nextInOrderPresident = null;

        this.president = this.getRandomActivePlayer();
        this.chancellor = null;

        this.phase = 0;
    }

    private isValidAction(player: Player, action: string, data: IIncommingData) {
        var PGE = player.gameExtension as SecretHitlerPlayerExtension;
        var that = this;

        // internal functions
        var checkSelectedUserId = (id: string) => {
            if (id) {
                var selectedPlayer = that.getPlayerById(id);
                if (selectedPlayer) {
                    return true;
                }
                else {
                    // Error: Wrong userId
                    console.log("Shitler-ValidateAction: Wrong userId");
                }
            }
            else {
                // Error: No userId
                console.log("Shitler-ValidateAction: No userId");
            }

            return false;
        };

        // checking
        if (this.phase === 0) {
            if (checkSelectedUserId(data.selectedUserId)) {
                var selectedPlayer = this.getPlayerById(data.selectedUserId);

                if (this.players.length <= 5) {
                    if (this.lastChancellor !== selectedPlayer) {
                        if (player !== selectedPlayer) {
                            if (!(<SecretHitlerPlayerExtension>selectedPlayer.gameExtension).isDead) {
                                return true;
                            }
                            else {
                                // Error: You can't nominate dead people
                                console.log("Shitler-ValidateAction: You can't nominate dead people");
                            }
                        }
                        else {
                            // Error: You can't select yourself
                            console.log("Shitler-ValidateAction: You can't select yourself");
                        }
                    }
                    else {
                        // Error: Player was chancellor last turn
                        console.log("Shitler-ValidateAction: Player was chancellor last turn");
                    }
                }
                else {
                    // 6 or more players
                    if (this.lastChancellor !== selectedPlayer && this.lastPresident !== selectedPlayer) {
                        return true;
                    }
                    else {
                        // Error: Player was president or chancellor last turn
                        console.log("Shitler-ValidateAction: Player was president or chancellor last turn");
                    }
                }
            }
        }
        else if (this.phase === 1) {
            if (!PGE.voted) {
                if (data.vote !== undefined) {
                    return true;
                }
                else {
                    // Error: No vote submitted
                    console.log("Shitler-ValidateAction: No vote submitted");
                }
            }
            else {
                // Error: Already voted; Should not be reachable, because it's not players turn!
                console.log("Shitler-ValidateAction: Already voted; Should not be reachable, because it's not players turn!");
            }
        }
        else if (this.phase === 2) {
            if (data.selectedPolicyCards) {
                if (data.selectedPolicyCards.length === 2) {
                    var card1 = data.selectedPolicyCards[0];
                    var card2 = data.selectedPolicyCards[1];

                    if (this.currentlySelectedPolicyCards.indexOf(card1) !== -1 && this.currentlySelectedPolicyCards.indexOf(card2) !== -1) {
                        return true;
                    }
                    else {
                        // Error: Unowned policy cards selected
                        console.log("Shitler-ValidateAction: Unowned policy cards selected");
                    }
                }
                else {
                    // Error: Wrong number of policy cards
                    console.log("Shitler-ValidateAction: Wrong number of policy cards");
                }
            }
            else {
                // Error: No policy cards selected
                console.log("Shitler-ValidateAction: No policy cards selected");
            }
        }
        else if (this.phase === 3) {
            if (this.chancellorVetoed && data.veto !== undefined) {
                return true;
            }
            if (data.veto) {
                if (!this.alreadyVetoed) {
                    if (this.nrOfFascistPolicies >= 5) {
                        return true;
                    }
                    else {
                        // Error: Veto not yet allowed
                        console.log("Shitler-ValidateAction: Veto not yet allowed");
                    }
                }
                else {
                    // Error: Already tried to veto
                    console.log("Shitler-ValidateAction: Already tried to veto");
                }
            }
            else if (data.selectedPolicyCards) {
                if (data.selectedPolicyCards.length === 1) {
                    var card1 = data.selectedPolicyCards[0];

                    if (this.currentlySelectedPolicyCards.indexOf(card1) !== -1) {
                        return true;
                    }
                    else {
                        // Error: Unowned policy cards selected
                        console.log("Shitler-ValidateAction: Unowned policy cards selected");
                    }
                }
                else {
                    // Error: Wrong number of policy cards
                    console.log("Shitler-ValidateAction: Wrong number of policy cards");
                }
            }
            else {
                // Error: No policy cards selected
                console.log("Shitler-ValidateAction: No policy cards selected");
            }
        }
        else if (this.phase === 4) {
            if (this.nrOfFascistPolicies <= 3) {
                if (this.players.length <= 6) {
                    if (this.nrOfFascistPolicies === 3) {
                        return true; // no input required
                    }
                }
                else if (this.players.length <= 8) {
                    if (this.nrOfFascistPolicies >= 2) {
                        return checkSelectedUserId(data.selectedUserId);
                    }
                }
                else { // 9 - 10 Players
                    return checkSelectedUserId(data.selectedUserId);
                }
            }
            else {
                // Execution
                if (checkSelectedUserId(data.selectedUserId)) {
                    var selectedPlayer = this.getPlayerById(data.selectedUserId);
                    if (player !== selectedPlayer) {
                        return true;
                    }
                    else {
                        // Error: You can't kill yourself
                        console.log("Shitler-ValidateAction: You can't kill yourself");
                    }
                }
            }
        }

        return false;
    }

    private applyAction(player: Player, action: string, data: IIncommingData) {
        var PGE = player.gameExtension as SecretHitlerPlayerExtension;
        var that = this;

        // Powers
        var execute = (target: Player) => {
            var targetGE = target.gameExtension as SecretHitlerPlayerExtension;
            targetGE.isDead = true;

            for (var i = 0; i < that.activePlayers.length; i++) {
                if (that.activePlayers[i] === target) {
                    that.activePlayers.splice(i, 1);
                    break;
                }
            }

            if (targetGE.role === "Hitler") {
                this.gameOver();
            }
        }

        var investigateLoyalty = (target: Player) => {
            var targetGE = target.gameExtension as SecretHitlerPlayerExtension;
            var role = targetGE.role;

            var playerGE = player.gameExtension as SecretHitlerPlayerExtension;
            playerGE.inspectedPlayers.push(target);
        }

        var policyPeek = () => {
            this.eventuallyReshufflePolicyDeck()

            var sizeOfPolicyDeck = that.policyDeck.length;
            var nextPolicyCards = [that.policyDeck[sizeOfPolicyDeck - 1], that.policyDeck[sizeOfPolicyDeck - 2], that.policyDeck[sizeOfPolicyDeck - 3]];

            (<SecretHitlerPlayerExtension>that.president.gameExtension).policyPeek = nextPolicyCards;
        }

        var callSpecialElection = (target: Player) => {
            that.specialElectionPresident = target;
        }

        // Action
        if (this.phase === 0) {
            // President selects the next chancellor
            var selectedPlayer = this.getPlayerById(data.selectedUserId);
            this.chancellor = selectedPlayer;

            this.history.log(this.president.user.name + " nominated " + this.chancellor.user.name + " as chancellor.", {});

            this.phase = 1;
        }
        else if (this.phase === 1) {
            this.successfullVeto = false;
            this.voteFailed = false; // if the vote fails, the clients can still read this in phase 0

            // Vote for chancellor
            PGE.voted = true;
            PGE.votedFor = data.vote;
            this.voteCounter++;

            var nrOfPlayers = this.activePlayers.length;
            if (this.voteCounter >= nrOfPlayers) {
                var votesFor = 0;
                for (var i = 0; i < nrOfPlayers; i++) {
                    var activePlayerGE = this.activePlayers[i].gameExtension as SecretHitlerPlayerExtension;
                    if (activePlayerGE.votedFor) {
                        votesFor++;
                    }

                    this.history.log(this.activePlayers[i].user.name + " voted " + (activePlayerGE.votedFor ? "for " : "against ") + this.chancellor.user.name + " as chancellor.", {});
                }

                var votesAgainst = nrOfPlayers - votesFor;

                // Log: Chancellor won/lost with xx/yy votes.

                if (votesFor > votesAgainst) {
                    if (this.nrOfFascistPolicies >= 3 && (<SecretHitlerPlayerExtension>this.chancellor.gameExtension).role === "Hitler") {
                        this.gameOver();
                    }
                    else {
                        if (this.nrOfFascistPolicies >= 3) {
                            (<SecretHitlerPlayerExtension>this.chancellor.gameExtension).isNotHitler = true;
                        }

                        this.eventuallyReshufflePolicyDeck();

                        // Draw 3 policy cards
                        for (let i = 0; i < 3; i++) {
                            this.currentlySelectedPolicyCards.push(this.policyDeck.pop());
                        }

                        // Submit those 3 cards to the president
                        (<SecretHitlerPlayerExtension>this.president.gameExtension).presidentPolicyCards = this.currentlySelectedPolicyCards;

                        this.failedElections = 0;
                        this.phase = 2;
                    }
                }
                else {
                    // Vote failed
                    this.voteFailed = true;

                    this.failedElections++;
                    if (this.failedElections > 3) {
                        this.failedElections = 0;

                        // get new policy from deck
                        this.eventuallyReshufflePolicyDeck();
                        var policyCard = this.policyDeck.pop();

                        if (policyCard < 11) {
                            this.nrOfFascistPolicies++;
                            this.wasLastPolicyFascist = true;

                            if (this.nrOfFascistPolicies >= 6) {
                                this.gameOver();
                            }
                        }
                        else {
                            this.nrOfLiberalPolicies++;
                            this.wasLastPolicyFascist = false;

                            if (this.nrOfLiberalPolicies >= 5) {
                                this.gameOver();
                            }
                        }
                    }

                    this.chancellor = null;
                    this.endTurn();
                }
            }
        }
        else if (this.phase === 2) {
            // President selects 2 cards
            let card1 = data.selectedPolicyCards[0];
            let card2 = data.selectedPolicyCards[1];

            for (var i = 0; i < this.currentlySelectedPolicyCards.length; i++) {
                var policyCard = this.currentlySelectedPolicyCards[i];
                if (!(policyCard === card1 || policyCard === card2)) {
                    this.policyDiscard.push(policyCard);
                    this.currentlySelectedPolicyCards.splice(i, 1);
                    break;
                }
            }

            // Submit 2 cards to chancellor
            (<SecretHitlerPlayerExtension>this.chancellor.gameExtension).chancellorPolicyCards = this.currentlySelectedPolicyCards;
            (<SecretHitlerPlayerExtension>this.president.gameExtension).presidentPolicyCards = [];

            this.phase = 3;
        }
        else if (this.phase === 3) {
            var _endTurn = false;
            // Chancellor selects 1 card or veto
            if (this.chancellorVetoed) {
                if (data.veto) {
                    (<SecretHitlerPlayerExtension>this.chancellor.gameExtension).chancellorPolicyCards = [];
                    this.currentlySelectedPolicyCards = [];
                    this.successfullVeto = true;

                    _endTurn = true;
                }
                else {
                    // Veto denied
                    this.chancellorVetoed = false;
                    this.alreadyVetoed = true;
                }
            }
            else if (data.veto !== undefined) {
                this.chancellorVetoed = true;
            }
            else {
                let selectedFascist = false;
                let card1 = data.selectedPolicyCards[0];

                for (var i = 0; i < this.currentlySelectedPolicyCards.length; i++) {
                    var policyCard = this.currentlySelectedPolicyCards[i];
                    if (policyCard !== card1) {
                        this.policyDiscard.push(policyCard);
                        break;
                    }
                }

                // Put new policy in place
                if (card1 < 11) {
                    this.nrOfFascistPolicies++;
                    this.wasLastPolicyFascist = true;
                    selectedFascist = true;
                }
                else {
                    this.nrOfLiberalPolicies++;
                    this.wasLastPolicyFascist = false;
                }

                if (!selectedFascist) {
                    if (this.nrOfLiberalPolicies === 5) {
                        this.gameOver();
                    }
                    else {
                        _endTurn = true;
                    }
                } else {
                    if (this.nrOfFascistPolicies === 6) {
                        this.gameOver();
                    }
                    else if (this.players.length <= 6 && this.nrOfFascistPolicies <= 2) {
                        _endTurn = true;
                    }
                    else if (this.players.length <= 8 && this.nrOfFascistPolicies <= 1) {
                        _endTurn = true;
                    }
                    else {
                        this.phase = 4;
                    }
                }

                (<SecretHitlerPlayerExtension>this.chancellor.gameExtension).chancellorPolicyCards = [];
                this.currentlySelectedPolicyCards = [];
            }

            if (_endTurn) {
                this.endTurn();
            }
        }
        else if (this.phase === 4) {
            if (this.nrOfFascistPolicies <= 3) {
                if (this.players.length <= 6) {
                    if (this.nrOfFascistPolicies === 3) {
                        // Policy Peek
                        policyPeek();
                    }
                }
                else if (this.players.length <= 8) {
                    if (this.nrOfFascistPolicies === 2) {
                        // Investigate Loyality
                        var selectedPlayer = this.getPlayerById(data.selectedUserId);
                        investigateLoyalty(selectedPlayer);
                    }
                    else if (this.nrOfFascistPolicies === 3) {
                        // Call Special Election
                        var selectedPlayer = this.getPlayerById(data.selectedUserId);
                        callSpecialElection(selectedPlayer);
                    }
                }
                else { // 9 - 10 Players
                    if (this.nrOfFascistPolicies === 1) {
                        // Investigate Loyality
                        var selectedPlayer = this.getPlayerById(data.selectedUserId);
                        investigateLoyalty(selectedPlayer);
                    }
                    else if (this.nrOfFascistPolicies === 2) {
                        // Investigate Loyality
                        var selectedPlayer = this.getPlayerById(data.selectedUserId);
                        investigateLoyalty(selectedPlayer);
                    }
                    else if (this.nrOfFascistPolicies === 3) {
                        // Call Special Election
                        var selectedPlayer = this.getPlayerById(data.selectedUserId);
                        callSpecialElection(selectedPlayer);
                    }
                }
            }
            else {
                if (this.nrOfFascistPolicies === 4) {
                    // Execution
                    var selectedPlayer = this.getPlayerById(data.selectedUserId);
                    execute(selectedPlayer);
                }
                else if (this.nrOfFascistPolicies === 5) {
                    // Execution
                    var selectedPlayer = this.getPlayerById(data.selectedUserId);
                    execute(selectedPlayer);
                }
            }

            this.endTurn();
        }
    }

    private eventuallyReshufflePolicyDeck() {
        // Reshuffle if not enough cards
        if (this.policyDeck.length < 3) {
            this.policyDeck = this.policyDeck.concat(this.policyDiscard);
            this.policyDiscard = [];
            this.shuffleList(this.policyDeck);
        }
    }

    protected endTurn() {
        if (this.chancellor) {
            this.lastChancellor = this.chancellor;
        }

        

        if (!this.voteFailed) {
            // Reset policy peek after 1 turn
            if (this.lastPresident) {
                var lastPresidentGE = this.lastPresident.gameExtension as SecretHitlerPlayerExtension;
                if (lastPresidentGE.policyPeek.length > 0) {
                    lastPresidentGE.policyPeek = [];
                }
            }

            this.lastPresident = this.president;
        }

        // end turn for every player
        for (var i = 0; i < this.players.length; i++) {
            var activePlayerGE = this.players[i].gameExtension as SecretHitlerPlayerExtension;
            activePlayerGE.endTurn();
        }

        // select next president
        do {
            for (var i = 0; i < this.players.length; i++) {
                if (this.players[i] === this.president) {
                    this.president = this.players[this.players.length > (i + 1) ? (i + 1) : 0];
                    break;
                }
            }
        } while ((<SecretHitlerPlayerExtension>this.president.gameExtension).isDead);

        // Restore presidential order
        if (this.nextInOrderPresident) {
            this.president = this.nextInOrderPresident;
            this.nextInOrderPresident = null;
        }

        // Special Election
        if (this.specialElectionPresident) {
            this.nextInOrderPresident = this.president;
            this.president = this.specialElectionPresident;
            this.specialElectionPresident = null;
        }

        // reset variables
        this.chancellor = null;
        this.alreadyVetoed = false;
        this.chancellorVetoed = false;
        this.voteCounter = 0;
        this.phase = 0;

        this.checkForTurnNotifications();
    }

    private gameOver() {
        console.log("Shitler: Game Over");

        var fascistsWon: boolean;
        var wonByPolicies: boolean;

        if (this.nrOfLiberalPolicies >= 5) {
            fascistsWon = false;
            wonByPolicies = true;

            this.history.log("Liberals won by policies.", {});
        }
        else if (this.nrOfFascistPolicies >= 6) {
            fascistsWon = true;
            wonByPolicies = true;

            this.history.log("Fascists won by policies.", {});
        }
        else {
            var chancellorGE = this.chancellor.gameExtension as SecretHitlerPlayerExtension;
            wonByPolicies = false;

            if (chancellorGE.role === "Hitler") {
                fascistsWon = true;
                
                this.history.log("Fascists won with Hitler as chancellor.", {});
            }
            else {
                fascistsWon = false;

                this.history.log("Liberals won by killing Hitler.", {});
            }
        }

        var fascists = this.players.filter(player => {
            return (<SecretHitlerPlayerExtension>player.gameExtension).partyMembership === "Fascist";
        }).map(player => {
            return {
                id: player.user.id, isHitler: (<SecretHitlerPlayerExtension>player.gameExtension).role === "Hitler"
            }
        });

        var data = {
            fascistTeam: fascists,
            fascistsWon: fascistsWon,
            wonByPolicies: wonByPolicies
        }

        this.onGameOver(data);
    }

    protected toInitialJson(): ISecretHitlerGameState {
        var playerNames: any = {};

        for (var i = 0; i < this.players.length; i++) {
            var player = this.players[i];
            playerNames[player.user.id] = player.user.name;
        }

        return {
            options: {
            },
            playerNames: playerNames
        };
    }

    protected toJson(): ISecretHitlerGameState {

        var playerVotes: any[] = [];
        if (this.phase === 2 || this.phase === 0 && this.voteFailed) {
            playerVotes = this.players.map(player => {
                return {
                    votedFor: (<SecretHitlerPlayerExtension>player.gameExtension).votedFor
                }
            });
        }
        
        // console.log(playerVotes);

        return {
            players: this.players.map((player) => player.toJson()),
            playerVotes: playerVotes,
            president: this.president ? this.president.user.id : "",
            chancellor: this.chancellor ? this.chancellor.user.id : "",
            lastPresident: this.lastPresident ? this.lastPresident.user.id : "",
            lastChancellor: this.lastChancellor ? this.lastChancellor.user.id : "",
            policyDeck: this.policyDeck.length,
            policyDiscard: this.policyDiscard.length,
            chancellorVetoed: this.chancellorVetoed,
            alreadyVetoed: this.alreadyVetoed,
            successfullVeto: this.successfullVeto,
            failedElections: this.failedElections,
            voteFailed: this.voteFailed,
            nrOfFascistPolicies: this.nrOfFascistPolicies,
            nrOfLiberalPolicies: this.nrOfLiberalPolicies,
            wasLastPolicyFascist: this.wasLastPolicyFascist,
            phase: this.phase,
            isOver: this.isOver
        };
    }

    public isActionRequired(user: User) {
        if (this.isOver) return false;

        if (this.phase === 0) {
            return this.president.user === user;
        }
        else if (this.phase === 1) {
            var player = this.getPlayerByUser(user);
            return !(<SecretHitlerPlayerExtension>player.gameExtension).voted;
        }
        else if (this.phase === 2) {
            return this.president.user === user;
        }
        else if (this.phase === 3) {
            if (this.chancellorVetoed) {
                return this.president.user === user;
            }

            return this.chancellor.user === user;
        }
        else if (this.phase === 4) {
            return this.president.user === user;
        }
        
        return false;
    }

    protected isPlayersTurn(player: Player) {
        return this.isActionRequired(player.user);
    }

    public onTimerUpdate(dt: number) {
        // first version without timer
    }

    public onGameAction(user: User, data: IIncommingData) {
        var action = data.action as string;

        var player = this.getPlayerByUser(user) as Player;
        if (this.isPlayersTurn(player)) {
            if (this.isValidAction(player, action, data)) {
                this.applyAction(player, action, data);
                var that = this;
                this.ioEmitter.toEach(player => { return { player: player.toPrivateJson(), game: that.toJson()} });
            }
            else {
                console.log("Invalid turn.");
            }
        }
        else {
            console.log("Not your turn!");
        }
    }

    // static information
    public static displayName = "Secret Hitler";
    public static label = "secretHitler";

    public static settings = new Settings([
    ]);

    public static lobby = {
        minUser: 5,
        maxUser: 10,
        teams: {
            count: 0,
            minPlayers: 0,
            maxPlayers: 0,
            required: false
        }
    };

    public static prerequisites(nrOfPlayers: number) {
        return nrOfPlayers >= SecretHitlerGame.lobby.minUser && nrOfPlayers <= SecretHitlerGame.lobby.maxUser;
    }

    // getter for static variables
    public getDisplayName() {
        return SecretHitlerGame.displayName;
    }

    public getLabel() {
        return SecretHitlerGame.label;
    }

    public getSettings() {
        return SecretHitlerGame.settings;
    }

    public getLobbyInfo() {
        return SecretHitlerGame.lobby;
    }
}

// TODO: JSON data interfaces
interface ISecretHitlerGameState extends IGameState {
    
}

interface IIncommingData {
    action: string,
    selectedUserId: string,
    veto: boolean,
    vote: boolean,
    selectedPolicyCards: number[]
}