cardGameControllers.controller("SpaceBridgeCtrl", ["$scope", "$rootScope", "$location", "socket", "$routeParams",
	function ($scope, $rootScope, $location, socket, $routeParams) {
        var gameId = $routeParams.gameId;
        $scope.gameId = gameId;
        
        // Variable init
        $scope.game = {
            ship: {
                speed: 0
            }
        };
        
        $scope.updateShipSpeed = function () {
            socket.emit("gameAction", { game: { id: $scope.gameId }, action: "setShipSpeed", speed: $scope.game.ship.speed });
        };

        // Init
        socket.emit("gameInit", { game: { id: $scope.gameId, label: "spaceBridge" } });
        
        socket.on("connect", function () {
            socket.emit("gameInit", { game: { id: $scope.gameId, label: "spaceBridge" } });
        });
        
        socket.on("goToLandingPage", function () {
            $scope.goToLobby();
        });
        
        socket.on("spaceBridgeInitialUpdate", function (data) {
            console.log("Initial: ", data);
        });

        socket.on("spaceBridgeUpdate", function (data) {
            var gameState = data.game
            var playerState = data.player;

            $scope.game = gameState;
            $scope.player = playerState;
            
            console.log("Player:", playerState);
            console.log("Game:", gameState);
        });
        
        socket.on("spaceBridgeGameOver", function (data) {
			console.log("GameOver: ", data);
        });

        $scope.goToLobby = function () {
            $location.path("/lobby");
        }
        
        // Destructor
        $scope.$on("$destroy", function (e) {
            socket.off("goToLandingPage");
            socket.off("spaceBridgeInitialUpdate");
            socket.off("spaceBridgeUpdate");
            socket.off("spaceBridgeGameover");
            socket.off("connect");
            socket.emit("leaveGameRoom", { game: { id: $scope.gameId } });
        });
    }]);