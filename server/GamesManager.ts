import { Game, TimerType } from "./games/base/Game";
import { CompletedGame } from "./games/base/completed-game/CompletedGame";

export class GamesManager {
    private static gamesCounter = 0;

    public games: Game[] = [];
    public selectableGames: typeof Game[] = [];
    public completedGames: CompletedGame[] = [];

    public constructor() {
        
    }

    public addGame(game: Game) {
        this.games.push(game);
    }

    public removeGame(game: Game) {
        for (var i = 0; i < this.games.length; i++) {
            if (this.games[i] === game) {
                this.games.splice(i, 1);
                break;
            }
        }
    }

    public getGameById(id: string) {
        for (var i = 0; i < this.games.length; i++) {
            var game = this.games[i];
            if (game.id == id) {
                return game;
            }
        }
        return null;
    }

    public finishGame(game: Game) {
        const finishedGame = game.toFinishedGame();
        this.completedGames.push(finishedGame);

        for (let i = 0; i < game.players.length; i++) {
            const user = game.players[i].user;
            user.moveGameToHistory(game, finishedGame);
        }

        this.removeGame(game);
    }

    public getFinishedGameById(id: string) {
        for (var i = 0; i < this.completedGames.length; i++) {
            var finishedGames = this.completedGames[i];
            if (finishedGames.id == id) {
                return finishedGames;
            }
        }
        return null;
    }

    public addSelectableGame(game: typeof Game) {
        this.selectableGames.push(game);
    }

    public getSelectableGameByName(name: string) {
        for (var i = 0; i < this.selectableGames.length; i++) {
            var selectableGame = this.selectableGames[i];
            if (selectableGame.displayName === name) {
                return selectableGame;
            }
        }
        return null;
    }

    public getSelectableGameByLabel(label: string) {
        for (var i = 0; i < this.selectableGames.length; i++) {
            var selectableGame = this.selectableGames[i];
            if (selectableGame.label === label) {
                return selectableGame;
            }
        }
        return null;
    }

    public registerTimerEvents() {
        var that = this;
        var turnTimerLastTimeStamp = Date.now();

        var turnTimer = setInterval(function () {
            var last = turnTimerLastTimeStamp;
            turnTimerLastTimeStamp = Date.now();
            var dt = turnTimerLastTimeStamp - last;

            for (var i = 0; i < that.games.length; i++) {
                var game = that.games[i] as Game;
                if (game.timerType === TimerType.turnTimer) {
                    game.onTimerUpdate(dt);
                }
            }
        }, 1000);

        var realTimeTimer = setInterval(function () {
            var last = turnTimerLastTimeStamp;
            turnTimerLastTimeStamp = Date.now();
            var dt = (turnTimerLastTimeStamp - last) / 1000;

            for (var game of that.games) {
                if (game.timerType === TimerType.realtime) {
                    game.onTimerUpdate(dt);
                }
            }
        }, 50);
    }
}