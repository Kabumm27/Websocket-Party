cardGameControllers.controller("RTSPrototypeCtrl", ["$scope", "$rootScope", "$location", "socket", "$routeParams",
	function ($scope, $rootScope, $location, socket, $routeParams) {
        var gameId = $routeParams.gameId;
        $scope.gameId = gameId;

        // Init
        socket.emit("gameInit", { game: { id: $scope.gameId, label: "rtsPrototype" } });
        
        socket.on("connect", function () {
            socket.emit("gameInit", { game: { id: $scope.gameId, label: "rtsPrototype" } });
        });
        
        socket.on("goToLandingPage", function () {
            $scope.goToLobby();
        });
        
        socket.on("rtsPrototypeInitialUpdate", function (data) {
            console.log("Initial: ", data);
        });

        socket.on("rtsPrototypeUpdate", function (data) {
            var gameState = data.game
            var playerState = data.player;

            $scope.game = gameState;
            $scope.player = playerState;
            
            console.log("Player:", playerState);
            console.log("Game:", gameState);
        });
        
        socket.on("rtsPrototypeGameOver", function (data) {
            $scope.winner = data.winner;
			console.log("GameOver: ", data);
        });

        $scope.goToLobby = function () {
            $location.path("/lobby");
        }
        
        // Destructor
        $scope.$on("$destroy", function (e) {
            socket.off("goToLandingPage");
            socket.off("rtsPrototypeInitialUpdate");
            socket.off("rtsPrototypeUpdate");
            socket.off("rtsPrototypeGameover");
            socket.off("connect");
            socket.emit("leaveGameRoom", { game: { id: $scope.gameId } });
        });
    }]);