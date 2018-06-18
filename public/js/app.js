var cardGameApp = angular.module('cardGameApp', [
    'ngTouch',
    'ngRoute',
    'cardGameControllers',
    'cardGameServices'
]);
 
cardGameApp.config(['$routeProvider', '$locationProvider',
	function($routeProvider, $locationProvider) {
        $routeProvider.
		when('/lobby/:lobbyId', {
			templateUrl: 'partials/lobby.html',
			controller: 'LobbyCtrl'
		}).
		when('/game/mauMau/:gameId', {
            templateUrl: 'partials/mauMau.html',
            controller: 'MauMauCtrl'
        }).
        when('/game/mauMau/:gameId/stats', {
            templateUrl: 'partials/mauMauStats.html',
            controller: 'MauMauStatsCtrl'
        }).
		when('/game/secretHitler/:gameId', {
            templateUrl: 'partials/secretHitler.html',
            controller: 'SecretHitlerCtrl'
        }).
        when('/game/secretHitler/:gameId/stats', {
            templateUrl: 'partials/secretHitlerStats.html',
            controller: 'SecretHitlerStatsCtrl'
        }).
        when('/game/pictionary/:gameId', {
			templateUrl: 'partials/pictionary.html',
			controller: 'PictionaryCtrl'
		}).
		when('/game/spaceGame/:gameId', {
            templateUrl: 'partials/spaceGame.html',
            controller: 'SpaceGameCtrl'
        }).
        when('/game/risk/:gameId', {
            templateUrl: 'partials/risk.html',
            controller: 'RiskCtrl'
        }).
        when('/game/rtsPrototype/:gameId', {
            templateUrl: 'partials/rtsPrototype.html',
            controller: 'RTSPrototypeCtrl'
        }).
        when('/game/spaceBridge/:gameId', {
            templateUrl: 'partials/spaceBridge.html',
            controller: 'SpaceBridgeCtrl'
        }).
        when('/browser', {
			templateUrl: 'partials/browser.html',
			controller: 'BrowserCtrl'
		}).
        when('/test', {
			templateUrl: 'partials/test.html',
			controller: 'TestCtrl'
		}).
		otherwise({
			redirectTo: '/browser'
		});
			
		//$locationProvider.html5Mode(true);
}]);

cardGameApp.directive("ngTap", function() {
    return function($scope, $element, $attributes) {
        var tapped = false;

        $element.bind("click", function(event) {
            if (!tapped) {
                $scope.$event = event;
                return $scope.$apply($attributes["ngTap"]);
            }
        });

        $element.bind("touchstart", function(event) {
            return tapped = true;
        });

        $element.bind("touchmove", function(event) {
            tapped = false;
            return event.stopImmediatePropagation();
        });

        return $element.bind("touchend", function() {
            if (tapped) {
                $scope.$event = event;
                return $scope.$apply($attributes["ngTap"]);
            }
        });

    }
});

cardGameApp.directive("ngTouchstart", function() {
    return function($scope, $element, $attributes) {

        $element.bind("touchstart", function(event) {
            $scope.$event = event;
            return $scope.$apply($attributes["ngTouchstart"]);
        });

    }
});

cardGameApp.directive("ngTouchmove", function() {
    return function($scope, $element, $attributes) {

        $element.bind("touchmove", function(event) {
            $scope.$event = event;
            return $scope.$apply($attributes["ngTouchmove"]);
        });

    }
});

cardGameApp.directive("ngTouchend", function() {
    return function($scope, $element, $attributes) {

        $element.bind("touchend", function(event) {
            $scope.$event = event;
            return $scope.$apply($attributes["ngTouchend"]);
        });

    }
});