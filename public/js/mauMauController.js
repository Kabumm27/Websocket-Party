cardGameControllers.controller("MauMauCtrl", ["$scope", "$rootScope", "$location", "socket", "$routeParams", "$sce",
    function ($scope, $rootScope, $location, socket, $routeParams, $sce) {
        $scope.Math = Math;
        $rootScope.pagetitle = "Mau Mau";
        $scope.gameId = $routeParams.gameId;
        
        var lastTimerUpdate;
        var intervalId;
        
        $scope.symbol = {
            Spades: $sce.trustAsHtml("&spades;"),
            Clubs: $sce.trustAsHtml("&clubs;"),
            Hearts: $sce.trustAsHtml("&hearts;"),
            Diamonds: $sce.trustAsHtml("&diams;")
        };
		
		// Init
        socket.emit("gameInit", { game: { id: $scope.gameId, label: "mauMau" } });
        
        socket.on("connect", function () {
            console.log("reconnected");
            socket.emit("gameInit", { game: { id: $scope.gameId, label: "mauMau" } });
        });
		
		socket.on("goToLandingPage", function() {
			$scope.goToLobby();
        });
        
        socket.on("mauMauInitialUpdate", function (state) {
            $scope.initialData = state.game;
            $scope.playerNames = state.game.playerNames;

            //console.log("Initial: ", state);
        });
		
		socket.on("mauMauUpdate", function(state) {
			$scope.game = state.game;
            $scope.player = state.player;
            $scope.validMoves = validMoves(state.player, state.game, $scope.initialData);
            
            if ($scope.initialData.options.totalTurnTimer !== 0) {
                clearInterval($scope.timer);
                lastTimerUpdate = Date.now();
                $scope.intervalId = setInterval(function () {
                    var newTime = Date.now();
                    var deltaTime = newTime - lastTimerUpdate;
                    lastTimerUpdate = newTime;
                    
                    $scope.game.currentTurnTime -= deltaTime;
                    $rootScope.$applyAsync();
                }, 1000);
            }

            //console.log(state.game.currentTurnTime);
            //console.log("GameState: ", state.game);
            //console.log("PlayerState: ", state.player);
		});
		
		socket.on("mauMauGameover", function() {
			//$scope.winners = winners;
            //console.log(winners);

            $location.path("/game/mauMau/" + $scope.gameId + "/stats");
        });
        
        $scope.playCard = function (card) {
            socket.emit("gameAction", { game: { id: $scope.gameId }, action: "takeTurn", type: "playCard", card: card });
        }
        
        $scope.drawCard = function () {
            socket.emit("gameAction", { game: { id: $scope.gameId }, action: "takeTurn", type: "drawCard" });
        }

		$scope.endTurn = function() {
			socket.emit("gameAction", { game: { id: $scope.gameId }, action: "takeTurn", type: "endTurn" });
		}
		
		$scope.wishSuit = function(suit) {
			socket.emit("gameAction", { game: { id: $scope.gameId }, action: "takeTurn", type: "wishSuit", wishedSuit: suit });
		}
		
		$scope.goToLobby = function() {
			$location.path("/lobby");
		}
		
        // Clientside move-checker
		function validMoves(player, game, initialData) {
			if (!(game || player) || player.id !== game.currentPlayer) return {
				    cards: [],
				    drawCard: false,
				    wishSuit: false,
				    endTurn: false
			    };
		
			// Card Class
			function Card(suit, rank) {
				this.suit = suit;
				this.rank = rank;
				
				this.name = suit + " " + rank;
				
				this.turnPlayed;
				this.wishedSuit;
			}

			Card.prototype.isPlayable = function(topCard, turn) {
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

			Card.prototype.isSpecial = function() {
				return this.isTake2Card() || this.isSkipCard() || this.isWishCard();
			}

			Card.prototype.isTake2Card = function() {
				return this.rank === "7";
			}

			Card.prototype.isSkipCard = function() {
				return this.rank === "8";
			}

			Card.prototype.isWishCard = function() {
				return this.rank === "B";
			}

			Card.prototype.playedLastTurn = function(turn) {
				return (this.turnPlayed + 1) === turn;
			}
			
			// Functions
            function isValidMove(type, card) {
                var drawAndPlay = initialData.options.drawAndPlay;

				var turn = game.turn + (player.state.cardDrawn ? 1 : 0);
				var topCard = new Card(game.playingStack.topCard.suit, game.playingStack.topCard.rank);
				topCard.turnPlayed = game.playingStack.topCard.turnPlayed;
				topCard.wishedSuit = game.playingStack.topCard.wishedSuit;
				var skip = !player.state.cardPlayed && topCard.playedLastTurn(game.turn) && topCard.isSkipCard();
				var noCardPlayable = player.state.cards.every(function(c) {
					var card = new Card(c.suit, c.rank);
					return !card.isPlayable(topCard, turn);
				});

				if (type === 'playCard') {
					var card = new Card(card.suit, card.rank);
                    
					return card.isPlayable(topCard, turn) && (!player.state.cardDrawn || drawAndPlay) && !player.state.cardPlayed && !player.state.wishSuit;
				}
                else if (type === 'drawCard') {
                    return !player.state.cardDrawn && !player.state.cardPlayed && !player.state.wishSuit && !skip && (game.drawingStack.cardsCount !== 0 || game.playingStack.cardsCount > 1);
                    //return noCardPlayable && !player.state.cardDrawn && !player.state.cardPlayed && !player.state.wishSuit && !skip;
				}
				else if (type === 'wishSuit') {
					return player.state.wishSuit;
				}
				else if (type === 'endTurn') {
					return !player.state.wishSuit && (player.state.cardPlayed || player.state.cardDrawn || skip);
				}
				else {
					return false;
				}
			}
			
			// Calls
            //var playableCards = player.state.cards.filter(function(c) { return isValidMove('playCard', c); });
            var cardsPlayable = player.state.cards.map(function (c) { return isValidMove("playCard", c); });
			var drawCard = isValidMove("drawCard", null);
			var wishSuit = isValidMove("wishSuit", null);
			var endTurn = isValidMove("endTurn", null);
			
			return {
				cards: cardsPlayable,
				drawCard: drawCard,
				wishSuit: wishSuit,
				endTurn: endTurn
			};
        }
        
        // Destructor
        $scope.$on("$destroy", function (e) {
            //socket.removeAllListeners();
            socket.off("goToLandingPage");
            socket.off("mauMauInitialUpdate");
            socket.off("mauMauUpdate");
            socket.off("mauMauGameover");
            socket.off("connect");
            socket.emit("leaveGameRoom", { game: { id: $scope.gameId } });
        });

    }
]);

cardGameControllers.controller('MauMauStatsCtrl', ['$scope', '$location', 'socket', '$routeParams',
    function ($scope, $location, socket, $routeParams) {
        var gameId = $routeParams.gameId;
         
        // init
        socket.emit('statsInit', { game: { id: gameId, label: "mauMau" } });

        // on Stats
        socket.on('goToLandingPage', function () {
            $scope.goToLobby();
        });
        
        socket.on("mauMauStatsInit", function (data) {
            console.log(data);

            $scope.stats = data.stats.values;
            $scope.players = data.players;
        });


        $scope.goToLobby = function () {
            $location.path("/lobby");
        }

    }
]);