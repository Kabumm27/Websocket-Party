cardGameControllers.controller("BrowserCtrl", ["$scope", "$rootScope", "$location", "socket",
    function ($scope, $rootScope, $location, socket) {
        $scope.selectedTab = 0;

        $scope.selectedLobbyId;
        $scope.selectedLobbyIndex = -1;
        
        $scope.activeRunningGames;

        $scope.createNewLobby = {
            game: null,
            maxUsers: 2,
            privacy: "Public",
            name: "My Game Lobby"
        }
        
        $rootScope.pagetitle = "Gamebrowser";
        
        socket.emit("browserAction", { action: "init" });
        
        socket.on("browserUpdateLobbies", function (data) {
            $scope.openLobbies = data.lobbies;
        });
        
        socket.on("browserUpdateSelectableGames", function (data) {
            $scope.selectableGames = data.selectableGames;
            $scope.createNewLobby.game = data.selectableGames[0];
        });
        
        socket.on("browserUpdateRunningGames", function (data) {
            $scope.runningGames = data.runningGames;

            $scope.activeRunningGames = 0;
            for (var i = 0; i < data.runningGames.length; i++) {
                if (data.runningGames[i].isYourTurn) {
                    $scope.activeRunningGames++;
                }
            }
        });
        
        socket.on("browserJoinLobby", function (lobbyId) {
            $location.path("/lobby/" + lobbyId);
        });
        
        $scope.selectTab = function (tab) {
            $scope.selectedTab = tab;
        }
        
        $scope.joinLobby = function ($event, $index, lobbyId) {
            if ($event.detail === 2) {
                $location.path('/lobby/' + lobbyId);
            } else {
                $scope.selectedLobbyIndex = $index;
                $scope.selectedLobbyId = lobbyId;
            }
        }
        
        $scope.joinLobbyButton = function () {
            $location.path('/lobby/' + $scope.selectedLobbyId);
        }
        
        $scope.selectGame = function (game) {
            $scope.createNewLobby.game = game;
            $scope.createNewLobby.maxUsers = game.maxUsers
        }

        $scope.createLobby = function () {
            var lobbyName = $scope.createNewLobby.name;
            var gameLabel = $scope.createNewLobby.game.label;
            var maxUsers = parseInt($scope.createNewLobby.maxUsers);
            var privacy = $scope.createNewLobby.privacy;

            socket.emit("lobbyAction", { action: "create", lobbyName: lobbyName, gameLabel: gameLabel, maxUser: maxUsers, privacy: privacy });
        }
        
        $scope.refreshList = function () {
            socket.emit('browserAction', { action: "refresh" });
        }
        
        $scope.goToGame = function (controller, gameId) {
            $location.path('/game/' + controller + '/' + gameId);
        }
        
        // Destructor
        $scope.$on('$destroy', function (e) {
            socket.off("browserUpdateList");
            socket.off("browserUpdateSelectableGames");
            socket.off("browserUpdateRunningGames");
            socket.off("browserJoinLobby");
        });
    }]);