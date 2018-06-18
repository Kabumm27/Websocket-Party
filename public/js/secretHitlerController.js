cardGameControllers.controller('SecretHitlerCtrl', ['$scope', '$rootScope', '$location', 'socket', '$routeParams',
    function ($scope, $rootScope, $location, socket, $routeParams) {
        $rootScope.pagetitle = "Secret Hitler";

        var gameId = $routeParams.gameId;
        $scope.gameId = gameId;
        $scope.privateInformationToggle = true;
        
        $scope.checkboxModel = {
            "presidentPolicyCards": [false, false, false],
            "chancellorPolicyCards": [false, false]
        }
        
        // Init
        socket.emit('gameInit', { game: { id: gameId, label: "secretHitler" } });
        
        socket.on('goToLandingPage', function () {
            $scope.goToLobby();
        });
        
        socket.on("secretHitlerInitialUpdate", function (state) {
            $scope.initialData = state.game;
            $scope.playerNames = state.game.playerNames;

            console.log("Initial Update: ", state);
        });
        
        socket.on("secretHitlerUpdate", function (state) {
            var gameState = state.game
            var playerState = state.player;
            
            $scope.game = gameState;
            $scope.player = playerState;
            
            // Reset the checkboxModel
            if (gameState.phase === 1) {
                $scope.checkboxModel["presidentPolicyCards"] = [false, false, false];
                $scope.checkboxModel["chancellorPolicyCards"] = [false, false];
            }
            

            //console.log(gameState.currentTurnTime);
            console.log("GameState: ", gameState);
            console.log("PlayerState: ", playerState);
        });
        
        socket.on("secretHitlerGameover", function (data) {
            $scope.gameOver = data;
            
            console.log("Gameover", data);
            //$location.path("/game/secretHitler/" + $scope.gameId + "/stats");
        });
        
        $scope.setChancellor = function(id) {
            socket.emit("gameAction", { game: { id: gameId }, selectedUserId: id });
        }
        
        $scope.voteForChancellor = function(vote) {
            socket.emit("gameAction", { game: { id: gameId }, vote: vote });
        }
        
        $scope.choosePresidentialPolicyCards = function(checkboxes) {
            var policyCards = [];
            for (var i = 0; i < checkboxes.length; i++) {
                if (checkboxes[i]) {
                    policyCards.push($scope.player.state.presidentPolicyCards[i]);
                }
            }

            socket.emit("gameAction", { game: { id: gameId }, selectedPolicyCards: policyCards });
        }
        
        $scope.chooseChancellorPolicyCards = function(checkboxes) {
            var policyCards = [];
            for (var i = 0; i < checkboxes.length; i++) {
                if (checkboxes[i]) {
                    policyCards.push($scope.player.state.chancellorPolicyCards[i]);
                }
            }
            
            socket.emit("gameAction", { game: { id: gameId }, selectedPolicyCards: policyCards });
        }
        
        $scope.veto = function(veto) {
            console.log("Veto");
            socket.emit("gameAction", { game: { id: gameId }, action: "veto", veto: veto });
        }
        
        $scope.policyPeek = function() {
            console.log("policy Peek");
            socket.emit("gameAction", { game: { id: gameId }, action: "policyPeek" });
        }
        
        $scope.execute = function(id) {
            console.log("execution");
            socket.emit("gameAction", { game: { id: gameId }, action: "execute" , selectedUserId: id });
        }
        
        $scope.inspectLoyalty = function (id) {
            console.log("inspect loyalty");
            socket.emit("gameAction", { game: { id: gameId }, action: "inspectLoyalty" , selectedUserId: id });
        }
        
        $scope.specialElection = function (id) {
            console.log("special election");
            socket.emit("gameAction", { game: { id: gameId }, action: "specialElection" , selectedUserId: id });
        }
		
		$scope.goToLobby = function() {
			$location.path("/lobby");
		}
        
        // shortcuts
        $scope.canBeChancellor = function (player) {
            //p.id === player.id || p.id === p.lastChancellor || p.isDead
            if (player.id === $scope.player.id) return true;
            if (player.id === $scope.game.lastChancellor) return true;
            if ($scope.game.players.length >= 6 && player.id === $scope.game.lastPresident) return true;
            if (player.state.isDead) return true;

            return false;
        }
        
        $scope.policyPeekEnabled = function (nrOfPlayers, nrOfFascistPolicies) {
            return nrOfPlayers <= 6 && nrOfFascistPolicies === 3;
        }
        
        $scope.investigateLoyaltyEnabled = function (nrOfPlayers, nrOfFascistPolicies) {
            if (nrOfPlayers >= 9) {
                return nrOfFascistPolicies === 1 || nrOfFascistPolicies === 2;
            }
            else if (nrOfPlayers >= 7) {
                return nrOfFascistPolicies === 2;
            }

            return false;
        }
        
        $scope.specialElectionEnabled = function (nrOfPlayers, nrOfFascistPolicies) {
            if (nrOfFascistPolicies === 3) {
                return nrOfPlayers > 6;
            }

            return false;
        }
        
        $scope.executionEnabled = function (nrOfPlayers, nrOfFascistPolicies) {
            return nrOfFascistPolicies === 4 || nrOfFascistPolicies === 5;
        }

		// Destructor
		$scope.$on('$destroy', function (e) {
            //socket.removeAllListeners();
            socket.off("goToLandingPage");
            socket.off("secretHitlerInitialUpdate");
            socket.off("secretHitlerUpdate");
            socket.off("secretHitlerGameover");
            socket.emit("leaveGameRoom", { game: { id: $scope.gameId } });
		});
    }
]);

cardGameControllers.controller('SecretHitlerStatsCtrl', ['$scope', '$location', 'socket', '$routeParams',
    function ($scope, $location, socket, $routeParams) {
        var gameId = $routeParams.gameId;
         
        // init
        socket.emit('statsInit', { game: { id: gameId, label: "mauMau" } });

        // on Stats
        socket.on('goToLandingPage', function () {
            $scope.goToLobby();
        });
        
        socket.on("secretHitlerStatsInit", function (data) {
            console.log(data);

            $scope.stats = data.stats.values;
            $scope.players = data.players;
        });


        $scope.goToLobby = function () {
            $location.path("/lobby");
        }

        // Destructor
        $scope.$on('$destroy', function (e) {
            //socket.removeAllListeners();
            socket.off("secretHitlerStatsInit");
        });
    }
]);