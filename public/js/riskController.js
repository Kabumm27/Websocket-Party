cardGameControllers.controller("RiskCtrl", ["$scope", "$rootScope", "$location", "socket", "$routeParams",
	function ($scope, $rootScope, $location, socket, $routeParams) {
        var gameId = $routeParams.gameId;
        $scope.gameId = gameId;

        $scope.neighbours = {};
        $scope.selectedTroops = 0;
        $scope.selectedRegion;
        $scope.hoverRegion;
        $scope.targetRegion;
        $scope.pathToTarget = "";
        
        $scope.playerCards = [];

        
        // Test
        $scope.mapData;// = globalMapData.map;
        $scope.mapLinks;// = globalMapData.links;

        // Init
        socket.emit("gameInit", { game: { id: $scope.gameId, label: "risk" } });
        
        socket.on("connect", function () {
            socket.emit("gameInit", { game: { id: $scope.gameId, label: "risk" } });
        });
        
        socket.on("goToLandingPage", function () {
            $scope.goToLobby();
        });
        
        socket.on("riskInitialUpdate", function (data) {            
            for (var i = 0; i < data.game.mapData.links.length; i++) {
                var link = data.game.mapData.links[i];
                var country1, country2;
                for (var j = 0; j < data.game.mapData.map.length; j++) {
                    var continent = data.game.mapData.map[j];
                    for (var k = 0; k < continent.countries.length; k++) {
                        var country = continent.countries[k];
                        if (link.country1 === country.name) {
                            country1 = country;
                        }
                        else if (link.country2 === country.name) {
                            country2 = country;
                        }
                    }
                }
                if (!country1["neighbours"]) country1.neighbours = [];
                if (!country2["neighbours"]) country2.neighbours = [];
                
                country1["neighbours"].push(country2);
                country2["neighbours"].push(country1);
            }

            $scope.mapData = data.game.mapData.map;
            $scope.mapLinks = data.game.mapData.links;
            
            var player1 = data.game.playerInfo["4kU6TNvse"];
            if (player1) {
                player1.color = "lightblue";
            }
            
            var player2 = data.game.playerInfo["V1bAaVwig"];
            if (player2) {
                player2.color = "green";
            }

            $scope.playerInfo = data.game.playerInfo;

            //console.log("Initial: ", data);
        });

        socket.on("riskUpdate", function (data) {
            var gameState = data.game
            var playerState = data.player;
            
            //console.log("Update: ", data);
            $scope.playerCards = [];
            for (var i = 0; i < gameState.players.length; i++) {
                var player = gameState.players[i];
                
                // count troops
                var troops = 0;
                var nrOfRegions = 0;
                for (var key in gameState.regions) {
                    var region = gameState.regions[key];
                    if (region.owner === player.id) {
                        troops += region.troops;
                        nrOfRegions++;
                    }
                }
                
                // check for continent bonus
                var continentBonus = 0;
                for (var j = 0; j < $scope.mapData.length; j++) {
                    var continent = $scope.mapData[j];
                    var ownsWholeContinent = true;
                    for (var k = 0; k < continent.countries.length; k++) {
                        var region = continent.countries[k];
                        if (gameState.regions[region.id].owner !== player.id) {
                            ownsWholeContinent = false;
                            break;
                        }
                    }

                    if (ownsWholeContinent) {
                        continentBonus += continent.bonusArmies;
                    }
                }
                
                // bonus armies for regions
                var bonus = Math.floor(nrOfRegions / 3) + continentBonus;

                var playerCard = {
                    name: $scope.playerInfo[player.id].name,
                    currentPlayer: player.id === gameState.currentPlayer,
                    troops: troops,
                    bonusArmies: bonus,
                    regions: nrOfRegions
                }

                $scope.playerCards.push(playerCard);
            }

            $scope.game = gameState;
            $scope.player = playerState;
        });
        
        socket.on("riskGameOver", function (data) {
            $scope.winner = data.winner;
			console.log("GameOver: ", data);
        });

        
        function reset() {
            $scope.selectedRegion = null;
            $scope.neighbours = {};
            $scope.pathToTarget = "";
            $scope.targetRegion = null;

            //console.log("reset");
        }

        $scope.endPhase = function () {
            //console.log("endPhase");
            socket.emit("gameAction", { game: { id: gameId }, action: "endPhase" });
        }
        
        function reinforceRegion(regionId, troops) {
            socket.emit("gameAction", { game: { id: $scope.gameId }, action: "reinforce", targetRegion: regionId, unitCount: troops });
            reset();
        }
        
        function attackRegion (sourceRegionId, targetRegionId, troops) {
            socket.emit("gameAction", { game: { id: $scope.gameId }, action: "attack", sourceRegion: sourceRegionId, targetRegion: targetRegionId, unitCount: troops });
            reset();
        }
        
        function moveTroops (sourceRegionId, targetRegionId, troops) {
            socket.emit("gameAction", { game: { id: $scope.gameId }, action: "move", sourceRegion: sourceRegionId, targetRegion: targetRegionId, unitCount: troops });
            reset();
        }
        

        $scope.backgroundClick = function ($e) {
            var nodeName = $e.target.nodeName;
            if (nodeName === "svg" || nodeName === "DIV") {
                reset();
            }
        }
        
        $scope.phaseAction = function (id) {
            var region;
            for (var i = 0; i < $scope.mapData.length; i++) {
                var continent = $scope.mapData[i];
                for (var j = 0; j < continent.countries.length; j++) {
                    var country = continent.countries[j];
                    if (country.id === id) {
                        region = country;
                    }
                }
            }

            if ($scope.selectedRegion && $scope.game.phase === 1) {
                var ownRegionSelected = $scope.game.regions[$scope.selectedRegion.id].owner === $scope.player.id;
                var enemyTargetSelected = $scope.game.regions[id].owner !== $scope.player.id;
                
                if (ownRegionSelected && enemyTargetSelected) {
                    var isNeighbour = false;
                    for (var i = 0; i < $scope.selectedRegion.neighbours.length; i++) {
                        var neighbour = $scope.selectedRegion.neighbours[i];
                        if (neighbour.id === id) {
                            isNeighbour = true;
                            break;
                        }
                    }
                    
                    if (isNeighbour) {
                        $scope.targetRegion = region;
                        $scope.selectedTroops = $scope.game.regions[$scope.selectedRegion.id].troops - 1;
                        
                        var start = $scope.selectedRegion.center;
                        var target = region.center;
                        $scope.pathToTarget = "M" + start.x + "," + start.y + " L" + target.x + "," + target.y;
                    }
                }
                else if (!enemyTargetSelected) {
                    reset();
                    $scope.selectedRegion = region;
                }
            }
            else if ($scope.selectedRegion && $scope.game.phase === 2) {
                var ownRegionSelected = $scope.game.regions[$scope.selectedRegion.id].owner === $scope.player.id;
                var ownTargetSelected = $scope.game.regions[id].owner === $scope.player.id;

                if (ownRegionSelected && ownTargetSelected) {
                    var isNeighbour = false;
                    for (var i = 0; i < $scope.selectedRegion.neighbours.length; i++) {
                        var neighbour = $scope.selectedRegion.neighbours[i];
                        if (neighbour.id === id) {
                            isNeighbour = true;
                            break;
                        }
                    }
                    
                    if (isNeighbour) {
                        $scope.targetRegion = region;
                        $scope.selectedTroops = $scope.game.regions[$scope.selectedRegion.id].troops - 1;
                        
                        var start = $scope.selectedRegion.center;
                        var target = region.center;
                        $scope.pathToTarget = "M" + start.x + "," + start.y + " L" + target.x + "," + target.y;
                    }
                    else {
                        reset();
                        $scope.selectedRegion = region;
                    }
                }
            }
            else {
                reset();
                $scope.selectedRegion = region;
                
                if ($scope.game.phase === 0) {
                    $scope.selectedTroops = $scope.player.state.reinforcements;
                }
                
                for (var i = 0; i < $scope.selectedRegion.neighbours.length; i++) {
                    var neighbour = $scope.selectedRegion.neighbours[i];
                    $scope.neighbours[neighbour.id] = true;
                }
            }
        }
        
        $scope.execute = function () {
            if ($scope.game.phase === 0) {
                if ($scope.selectedRegion && $scope.selectedTroops) {
                    reinforceRegion($scope.selectedRegion.id, $scope.selectedTroops);
                }
            }
            else if ($scope.game.phase === 1) {
                if ($scope.selectedRegion && $scope.targetRegion && $scope.selectedTroops) {
                    attackRegion($scope.selectedRegion.id, $scope.targetRegion.id, $scope.selectedTroops);
                }
            }
            else if ($scope.game.phase === 2) {
                if ($scope.selectedRegion && $scope.targetRegion && $scope.selectedTroops) {
                    moveTroops($scope.selectedRegion.id, $scope.targetRegion.id, $scope.selectedTroops);
                }
            }
        }
        
        $scope.goToLobby = function () {
            $location.path("/lobby");
        }
        
        // Destructor
        $scope.$on("$destroy", function (e) {
            socket.off("goToLandingPage");
            socket.off("riskInitialUpdate");
            socket.off("riskUpdate");
            socket.off("riskGameover");
            socket.off("connect");
            socket.emit("leaveGameRoom", { game: { id: $scope.gameId } });
        });
    }]);