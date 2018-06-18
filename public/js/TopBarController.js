cardGameControllers.controller("TopBarCtrl", ["$scope", "$rootScope", "socket", "$location",
    function ($scope, $rootScope, socket, $location) {
        //$scope.username = "";
        $scope.showOptionsMenu = false;
        $scope.showGamesMenu = false;

        socket.on("initUser", function (data) {
            $rootScope.username = data.name;
            $rootScope.userId = data.id;

            //console.log(data);
        });
        
        socket.on("gameTurnNotification", function (data) {
            console.log("turnNotification: ", data);
        });
        
        $scope.goHome = function () {
            $location.path("/browser");
        }
        
        $scope.optionsMenu = function ($e) {
            $scope.showGamesMenu = false;
            $e.stopPropagation();
            
            function closeOptionsMenu() {
                $scope.showOptionsMenu = false;
                $rootScope.$applyAsync();
                document.removeEventListener("click", closeOptionsMenu, false);
            }

            if ($scope.showOptionsMenu) {
                closeOptionsMenu();
            }
            else {
                $scope.showOptionsMenu = true;
                document.addEventListener("click", closeOptionsMenu, false);
            }
        }
        
        $scope.gamesMenu = function ($e) {
            $scope.showOptionsMenu = false;
            $e.stopPropagation();
            
            function closeGamesMenu() {
                $scope.showGamesMenu = false;
                $rootScope.$applyAsync();
                document.removeEventListener("click", closeGamesMenu, false);
            }
            
            if ($scope.showGamesMenu) {
                closeGamesMenu();
            }
            else {
                $scope.showGamesMenu = true;
                document.addEventListener("click", closeGamesMenu, false);
            }
        }
        
        $scope.changeName = function () {
            var name = prompt("New name:");
            socket.emit("changeUsername", name);
        }

        // Destructor
        $scope.$on('$destroy', function (e) {
            //socket.removeAllListeners();
            socket.off("initUser");
            socket.off("gameTurnNotification");
        });
    }
]);