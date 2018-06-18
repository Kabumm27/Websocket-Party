cardGameControllers.controller('GameCtrl', ['$scope', '$location', 'socket', '$routeParams',
	function($scope, $location, socket, $routeParams) {
        var gameId = $routeParams.gameId;
        $scope.gameId = gameId;
		
		// Init
		socket.emit('cardGameInit', gameId);
		
		socket.on('goToLandingPage', function() {
			$scope.goToLobby();
		});
		
		socket.on('cardGameUpdate', function(state) {
            var gameState = state.game
            var playerState = state.player;

			$scope.game = gameState;
            $scope.player = playerState;
            $scope.validMoves = validMoves(playerState, gameState);
		});
		
		socket.on('cardGameOver', function(winners) {
			$scope.winners = winners;
			//console.log(winners);
		});
		
		$scope.endTurn = function() {
			socket.emit('cardGameMakeTurn', { gameId: gameId, type: 'endTurn' });
		}
		
		$scope.wishColor = function(color) {
			socket.emit('cardGameMakeTurn', { gameId: gameId, type: 'wishColor', color: color });
		}
		
		$scope.goToLobby = function() {
			$location.path('/lobby');
		}
		
		// Destructor
		$scope.$on('$destroy', function (e) {
			socket.removeAllListeners();
		});
		
        // Clientside move-checker
		function validMoves(player, game) {
			if (!(game || player) || !player.state.yourTurn) return {
				cards: [],
				drawCard: false,
				wishColor: false,
				endTurn: false
			};
		
			// Card Class
			function Card(color, nr) {
				this.color = color;
				this.nr = nr;
				
				this.name = color + " " + nr;
				
				this.turn;
				this.wish;
			}

			Card.prototype.isPlayable = function(topCard, turn) {
				if (topCard.isWishCard()) {
					return !this.isWishCard() && (topCard.wish ? topCard.wish == this.color : true);
				}
				else if (topCard.color === this.color || topCard.nr === this.nr) {
					if (topCard.isSkipCard() && topCard.playedLastTurn(turn)) {
						return topCard.nr === this.nr;
					}
					else if (topCard.isTake2Card() && topCard.playedLastTurn(turn)) {
						return topCard.nr === this.nr;
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
				return this.nr === "7";
			}

			Card.prototype.isSkipCard = function() {
				return this.nr === "8";
			}

			Card.prototype.isWishCard = function() {
				return this.nr === "B";
			}

			Card.prototype.playedLastTurn = function(turn) {
				return (this.turn + 1) === turn;
			}
			
			// Functions
			function isValidMove(type, card) {
				var turn = game.turn + (player.state.cardDrawn ? 1 : 0);
				var topCard = new Card(game.playingStack.topCard.color, game.playingStack.topCard.nr);
				topCard.turn = game.playingStack.topCard.turn;
				topCard.wish = game.playingStack.topCard.wish;
				var skip = !player.state.cardPlayed && topCard.playedLastTurn(game.turn) && topCard.isSkipCard();
				var noCardPlayable = player.cards.every(function(c) {
					var card = new Card(c.color, c.nr);
					return !card.isPlayable(topCard, turn);
				});

				if (type === 'playCard') {
					var card = new Card(card.color, card.nr);
					
					return card.isPlayable(topCard, turn) && !player.state.cardPlayed && !player.state.wishColor;
				}
				else if (type === 'drawCard') {
					return noCardPlayable && !player.state.cardDrawn && !player.state.cardPlayed && !player.state.wishColor && !skip;
				}
				else if (type === 'wishColor') {
					return player.state.wishColor;
				}
				else if (type === 'endTurn') {
					return !player.state.wishColor && (player.state.cardPlayed || (player.state.cardDrawn && noCardPlayable) || (skip && noCardPlayable));
				}
				else {
					return false;
				}
			}
			
			// Calls
			var playableCards = player.cards.filter(function(c) { return isValidMove('playCard', c); });
			var drawCard = isValidMove('drawCard', null);
			var wishColor = isValidMove('wishColor', null);
			var endTurn = isValidMove('endTurn', null);
			
			return {
				cards: playableCards,
				drawCard: drawCard,
				wishColor: wishColor,
				endTurn: endTurn
			};
		}
}]);

cardGameControllers.directive('uiCard', [ 'socket', function(socket) {
    return {
		restrict: 'E',
		scope: {
			card: "=",
			playableCards: "=",
            gameId: "="
		},
		link: function($scope, elem, attrs) {
                elem.addClass('card');
                elem.attr("draggable", "true");
			
			    var symbols = {
				    Spades: "&spades;",
				    Clubs: "&clubs;",
				    Hearts: "&hearts;",
				    Diamonds: "&diams;"
			    };
			
			    elem.html(symbols[$scope.card.color] + " " + $scope.card.nr);
			    if ($scope.card.color === 'Hearts' || $scope.card.color === 'Diamonds') {
				    elem.addClass('red');
			    }
			
			    $scope.playableCards.forEach(function(c) {
				    if (c.color === $scope.card.color && c.nr === $scope.card.nr) {
					    elem.addClass('playable');
				    }
			    });
		
			    elem.on('click', function() {
				    socket.emit('cardGameMakeTurn', { gameId: $scope.gameId, type: 'playCard', card: $scope.card });
			    });
		}
	};
}]);

cardGameControllers.directive('uiStack', [ 'socket', function(socket) {
    return {
		restrict: 'E',
		scope: {
			stack: "=",
			playable: "=",
			clickable: "=",
            gameId: "="
		},
		link: function($scope, elem, attrs) {		
			    elem.addClass('deck');
			
			    var symbols = {
				    Spades: "&spades;",
				    Clubs: "&clubs;",
				    Hearts: "&hearts;",
				    Diamonds: "&diams;"
			    };
			
			    $scope.$watch('stack', function(newVal, oldVal) {
				    if ($scope.stack) {
					    if ($scope.stack.topCard) {
						    elem.html(symbols[$scope.stack.topCard.color] + " " + $scope.stack.topCard.nr);
						    if ($scope.stack.topCard.color === 'Hearts' || $scope.stack.topCard.color === 'Diamonds') {
							    elem.addClass('red');
						    } else {
							    elem.removeClass('red');
						    }
					    } else {
						    //elem.html("hidden");
                            elem.addClass('cardBack');
					    }
				    }
			    });
			
			    $scope.$watch('playable', function(newVal, oldVal) {
				    if ($scope.clickable && $scope.playable) {
					    elem.addClass('playable');
				    }
				    else {
					    elem.removeClass('playable');
				    }
			    });
			
			    if ($scope.clickable) {
                    elem.attr("draggable", "true");
				    elem.on('click', function() {
					    socket.emit('cardGameMakeTurn', { gameId: $scope.gameId, type: 'drawCard' });
				    });
			    }
		}
	};
}]);