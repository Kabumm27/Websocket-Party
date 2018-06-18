var cardGameServices = angular.module('cardGameServices', []);

cardGameServices.factory('socket', ['$rootScope',
	function($rootScope) {
		//var socket = io.connect('http://localhost:8080');
        //var socket = io.connect(window.location.origin);
        socket = io.connect(window.location.origin); // not good

		return {
			on: function(event, callback) {
				socket.on(event, function () {
					var args = arguments;
					$rootScope.$applyAsync(function () {
						callback.apply(null, args);
					});
				});
			},
			off: function(event, callback) {
				socket.removeListener(event, callback);
			},
			emit: function(event, data, callback) {
				socket.emit(event, data, function () {
					var args = arguments;
					$rootScope.$applyAsync(function () {
						if (callback) {
							callback.apply(null, args);
						}
					});
				});
			},
			removeAllListeners: function() {
				socket.removeAllListeners();
            },
            off: function (eventName) {
                socket.off(eventName);
            },
			socketId: function() {
				//return io.sockets['http://localhost:8080'].sessionid;
				//return socket.socket.sessionid;
				return socket.io.engine.id;
			}
		};
}]);