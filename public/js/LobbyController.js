cardGameControllers.controller("LobbyCtrl", ["$scope", "$rootScope", "$location", "socket", "$routeParams",
    function ($scope, $rootScope, $location, socket, $routeParams) {
        var lobbyId = $routeParams.lobbyId;
        $scope.lobbyId = lobbyId;
        
        $rootScope.pagetitle = "Lobby";
        
        // Init
        socket.emit("lobbyAction", { action: "init", lobbyId: lobbyId });
        
        socket.on("connect", function () {
            socket.emit("lobbyAction", { action: "init", lobbyId: lobbyId });
        });
        
        socket.on("lobbyInital", function (data) {
            //console.log("lobbyInit ", data.userId);
            $scope.gameName = data.gameName;
            $scope.userId = data.userId;
            
            var teams = [];
            for (var i = 1; i <= data.options.nrOfTeams; i++) {
                teams.push(i);
            }
            
            $scope.teams = teams;
            
            $rootScope.pagetitle = "Lobby - " + data.gameName;
        });
        
        socket.on("goToBrowser", function () {
            console.log("geh zurück auf LOS");
            $location.path("/browser");
        });
        
        // Socket - Events
        socket.on("lobbyUserState", function (players) {
            //console.log("loobyUserListUpdate");
            $scope.players = players;
            $scope.player = players.filter(function (p) { return p.id === $scope.userId })[0];

            console.log($scope.player.team);
        });
        
        socket.on("lobbyGameStart", function (data) {
            //console.log(data);
            $location.path("/game/" + data.gameController + "/" + data.gameId);
        });
        
        // Socket - Emits
        $scope.setReadyState = function (readyState) {
            socket.emit("lobbyAction", { action: "changeUserState", lobbyId: lobbyId, readyState: readyState, team: 0, spectator: false });
        };

        $scope.setOptions = function (team) {
            // TODO: whole function
            // console.log("Team:", team);
            // console.log("Ready:", $scope.player.ready);
            team = team ? team : 0;
            var readyState = true;

            socket.emit("lobbyAction", { action: "changeUserState", lobbyId: lobbyId, readyState: readyState, team: team, spectator: false });
        }
        
        $scope.kickPlayer = function (socketId) {
            socket.emit("lobbyAction", { action: "kickPlayer", lobbyId: lobbyId, socketId: socketId });
        };
        
        $scope.startGame = function () {
            socket.emit("lobbyAction", { action: "gameStart", lobbyId: lobbyId });
        };
        
        // Settings
        socket.on('lobbySettings', function (data) {
            $scope.settings = data.settings;
            $scope.values = data.values;
        });
        
        socket.on('lobbySettingsValues', function (data) {
            $scope.values = data.values;
            
            console.log("onSettingsValues", data);
        });
        
        $scope.onSettingsChange = function (index) {
            if (validateSettings(index, $scope.values, $scope.settings)) {
                socket.emit("lobbyAction", { action: "changeSettings", lobbyId: $scope.lobbyId, index: index, value: $scope.values[index] });
            }
            else {
                $scope.values[index] = $scope.lastValue;
            }
        }
        
        $scope.onCheckboxChange = function (index) {
            if (validateSettings(index, $scope.values, $scope.settings)) {
                socket.emit("lobbyAction", { action: "changeSettings", lobbyId: $scope.lobbyId, index: index, value: $scope.values[index] });
            }
            else {
                $scope.values[index] = !value;
            }
        }
        
        $scope.saveLastValue = function (index) {
            $scope.lastValue = $scope.values[index];
        }
        
        function validateSettings(index, values, settings) {
            var settingsItem = settings[index];
            
            if (settingsItem.type === "int") {
                if (!isNaN(values[index]) && values[index] >= settingsItem.min && values[index] <= settingsItem.max) {
                    values[index] = Math.round(values[index] / settingsItem.step) * settingsItem.step;
                    return true;
                }
            }
            else if (settingsItem.type === "boolean") {
                return true;
            }
            else if (settingsItem.type === "selection") {
                for (var i = 0; i < settingsItem.options.length; i++) {
                    if (settingsItem.options[i] === values[index]) {
                        return true;
                    }
                }
            }
            else {
                return false;
            }
        }
        
        // Helpfull functions
        $scope.everyReady = function () {
            return $scope.players.every(function (p) {
                return p.ready || !p.active;
            });
        };
        
        $scope.showPlayerOptions = function ($event, player, index) {
            if ($scope.player.owner && player !== $scope.player) {
                $scope.showOptions = index === $scope.showOptions ? -1 : index;
            }
        };
        
        // Destructor
        $scope.$on('$destroy', function (e) {
            //socket.emit('lobbyLeaveRoom', lobbyId);
            socket.emit('lobbyAction', { action: "leaveRoom", lobbyId: lobbyId });
            //socket.removeAllListeners();
            socket.off("lobbyInital");
            socket.off("goToBrowser");
            socket.off("lobbyUserList");
            socket.off("lobbyGameStart");
        });
    }]);