var cardGameControllers = angular.module("cardGameControllers", []);

cardGameControllers.controller('TestCtrl', ['$scope', '$rootScope', '$location', 'socket', '$routeParams',
	function ($scope, $rootScope, $location, socket, $routeParams) {
        $rootScope.pagetitle = 'Test';
        
		// Destructor
		$scope.$on('$destroy', function (e) {
			//socket.removeAllListeners();
		});
}]);

cardGameControllers.controller('PictionaryCtrl', ['$scope', '$rootScope', '$location', 'socket', '$routeParams',
	function ($scope, $rootScope, $location, socket, $routeParams) {
        var gameId = $routeParams.gameId;
        $scope.gameId = gameId;
        $rootScope.pagetitle = 'Pictionary';

        $scope.canvas = document.getElementById('pictionaryCanvas');
        $scope.ctx = $scope.canvas.getContext('2d');

        $scope.isCurrentDrawer = false;
        $scope.mousedown = false;
        $scope.paths = [];
        $scope.currentPath = [];
        $scope.lineColor = 'black';
        $scope.lineWidth = 1;


        // Init Canvas
        var canvasMulti = 2;
        window.addEventListener('resize', onResize);
        onResize();

        function onResize() {
            var canvasDiv = document.getElementById('pictionaryRight');
            var canvasWidth = canvasDiv.offsetWidth > canvasDiv.offsetHeight ? canvasDiv.offsetHeight - 40 : canvasDiv.offsetWidth - 20;
        
            $scope.canvas.style.width = canvasWidth + 'px';
            $scope.canvas.width = canvasWidth;
            $scope.canvas.style.height = canvasWidth + 'px';
            $scope.canvas.height = canvasWidth;
            $scope.canvas.style.marginLeft = ((canvasDiv.offsetWidth / 2) - (canvasWidth / 2)) + 'px';
            $scope.canvas.style.marginTop = ((canvasDiv.offsetHeight / 2) - (canvasWidth / 2)) + 'px';

            canvasMulti = (1000 / $scope.canvas.width);

            socket.emit('pictionaryRequestCanvas', { gameId: gameId });
        }

        // Init
		socket.emit('pictionaryInit', gameId);

        socket.on('goToLandingPage', function() {
            $scope.goToLandingPage();
        });

        socket.on('pictionaryUpdate', function(state) {
            var gameState = state.game
            var playerState = state.player;

			$scope.game = gameState;
            $scope.player = playerState;

            $scope.lineWidth = gameState.currentPath.width;
            $scope.lineColor = gameState.currentPath.color;
		});

        socket.on('pictionaryUpdate', function(state) {
            var gameState = state.game;
            var playerState = state.player;

			$scope.game = gameState;
            $scope.player = playerState;

            $scope.guess = playerState.state.word;
            $scope.isCurrentDrawer = playerState.state.isCurrentDrawer;
		});

        socket.on('pictionaryGameOver', function() {
            $scope.game.timer.duration = 0;  // Not working?
        });

        $scope.goToLandingPage = function() {
            $location.path('/');
        }

        $scope.cancelGame = function() {
            socket.emit('pictionaryCancel', { gameId: gameId });
            $location.path('/');
        }

        
        // Drawing part
        $scope.mousedownEvent = function(e) {
            if ($scope.isCurrentDrawer) {
                var offsetLeft = $scope.canvas.offsetLeft + $scope.canvas.parentNode.offsetLeft;
                var offsetTop = $scope.canvas.offsetTop + $scope.canvas.parentNode.offsetTop + 70;

                moveTo((e.pageX - offsetLeft), (e.pageY - offsetTop));

                $scope.mousedown = true;
            }
        }

        $scope.mousemoveEvent = function(e) {
            if ($scope.isCurrentDrawer && $scope.mousedown) {
                var offsetLeft = $scope.canvas.offsetLeft + $scope.canvas.parentNode.offsetLeft;
                var offsetTop = $scope.canvas.offsetTop + $scope.canvas.parentNode.offsetTop + 70;

                lineTo((e.pageX - offsetLeft), (e.pageY - offsetTop));
            }
        }

        $scope.mouseupEvent = function(e) {
            if ($scope.isCurrentDrawer) {
                $scope.paths.push({ color: $scope.lineColor, width: $scope.lineWidth, lines: $scope.currentPath });
                $scope.currentPath = [];

                socket.emit('pictionaryEndPath', { gameId: gameId });

                $scope.mousedown = false;
            }
        }

        $scope.touchstartEvent = function(e) {
            if ($scope.isCurrentDrawer) {
                var offsetLeft = $scope.canvas.offsetLeft + $scope.canvas.parentNode.offsetLeft;
                var offsetTop = $scope.canvas.offsetTop + $scope.canvas.parentNode.offsetTop + 70;

                moveTo((e.touches[0].pageX - offsetLeft), (e.touches[0].pageY - offsetTop));

                $scope.mousedown = true;
            }
        }

        $scope.touchmoveEvent = function(e) {
            if ($scope.isCurrentDrawer && $scope.mousedown) {
                var offsetLeft = $scope.canvas.offsetLeft + $scope.canvas.parentNode.offsetLeft;
                var offsetTop = $scope.canvas.offsetTop + $scope.canvas.parentNode.offsetTop + 70;
                
                lineTo((e.touches[0].pageX - offsetLeft), (e.touches[0].pageY - offsetTop));

                e.preventDefault();
            }
        }

        $scope.touchendEvent = function(e) {
            if ($scope.isCurrentDrawer) {
                $scope.paths.push({ color: $scope.lineColor, width: $scope.lineWidth, lines: $scope.currentPath });
                $scope.currentPath = [];

                socket.emit('pictionaryEndPath', { gameId: gameId });

                $scope.mousedown = false;
            }
        }

        function moveTo(x, y) {
            var ctx = $scope.ctx;

            ctx.beginPath();
            ctx.moveTo(x, y);

            var coords = { x: x * canvasMulti, y: y * canvasMulti };
            $scope.currentPath.push(coords);

            socket.emit('pictionaryStartPath', { gameId: gameId, coords: coords });
        }

        function lineTo(x, y) {
            var ctx = $scope.ctx;

            ctx.lineTo(x, y);
            ctx.strokeStyle = $scope.lineColor;
            ctx.lineWidth = $scope.lineWidth;
            ctx.stroke();

            var coords = { x: x * canvasMulti, y: y * canvasMulti };
            $scope.currentPath.push(coords);

            socket.emit('pictionaryAddLine', { gameId: gameId, coords: coords });
        }

        // Line style
        $scope.setColor = function(color) {
            if ($scope.player.state.isCurrentDrawer) {
                $scope.lineColor = color;
                socket.emit('pictionarySetPathColor', { gameId: gameId, color: color });
            }
        }

        $scope.setWidth = function(width) {
            if ($scope.player.state.isCurrentDrawer) {
                $scope.lineWidth = width;
                socket.emit('pictionarySetPathWidth', { gameId: gameId, width: width });
            }
        }

        $scope.clearCanvas = function() {
            if ($scope.player.state.isCurrentDrawer) {
                var ctx = $scope.ctx;
                ctx.clearRect(0, 0, $scope.canvas.width, $scope.canvas.height);

                socket.emit('pictionaryClearCanvas', { gameId: gameId });
            }
        }


        socket.on('pictionarySetPathColor', function(color) {
            $scope.lineColor = color;
        });

        socket.on('pictionarySetPathWidth', function(width) {
            $scope.lineWidth = width;
        });

        socket.on('pictionaryStartPath', function(data) {
            var ctx = $scope.ctx;

            ctx.beginPath();
            ctx.moveTo(data.x / canvasMulti, data.y / canvasMulti);
        });

        socket.on('pictionaryAddLine', function(data) {
            var ctx = $scope.ctx;

            ctx.lineTo(data.x / canvasMulti, data.y / canvasMulti);
            ctx.strokeStyle = $scope.lineColor;
            ctx.lineWidth = $scope.lineWidth;
            ctx.stroke();
        });

        socket.on('pictionaryEndPath', function(data) {
            //var ctx = $scope.ctx;

        });

        socket.on('pictionaryInitCanvas', function(data) {
            var paths = data.paths;
            var currentPath = data.currentPath;
            var currentPathColor = data.currentPathColor;
            var currentPathWidth = data.currentPathWidth;
            var ctx = $scope.ctx;

            for (var i = 0; i < paths.length; i++) {
                var path = paths[i];
                ctx.beginPath();

                for (var j = 0; j < path.lines.length; j++) {
                    var line = path.lines[j];
                    var x = line.x / canvasMulti;
                    var y = line.y / canvasMulti;

                    if (j === 0) {
                        ctx.moveTo(x, y);
                    }
                    else {
                        ctx.lineTo(x, y);
                    }
                }

                ctx.strokeStyle = path.color;
                ctx.lineWidth = path.width;
                ctx.stroke();
            }

            for (var i = 0; i < currentPath.length; i++) {
                if (i === 0) {
                    ctx.moveTo(line.x, line.y);
                }
                else {
                    ctx.lineTo(line.x, line.y);
                }
            }

            ctx.strokeStyle = currentPathColor;
            ctx.lineWidth = currentPathWidth;
            ctx.stroke();

            $scope.lineColor = currentPathColor;
            $scope.lineWidth = currentPathWidth;
        });

        socket.on('pictionaryClearCanvas', function() {
            var ctx = $scope.ctx;

            ctx.clearRect(0, 0, $scope.canvas.width, $scope.canvas.height);
        });


        // Guessing part
        $scope.makeGuess = function(e, guess) {
            if (e.which === 13 && guess) {
                socket.emit('pictionaryMakeGuess', { gameId: gameId, guess: guess });

                $scope.guess = '';
            }
        }

        // Destructor
		$scope.$on('$destroy', function (e) {
            socket.emit('pictionaryLeaveView', gameId);
            window.removeEventListener('resize', onResize);
			socket.removeAllListeners();
		});
}]);

cardGameControllers.directive('chat', [ 'socket', function(socket) {
    return {
		restrict: 'E',
		scope: {
            roomId: '='
		},
        template: '<div id="chatDiv">'
                +   '<div id="chatScrollBox">'
                +       '<p style="display:block; margin:0px;" ng-repeat="c in filteredChatMessages | orderBy: \'timestamp\' ">'
                +           '{{c.text}}'
                +       '</p>'
                +   '</div>'
                +   '<input type="text" ng-model="chatMsg" ng-keypress="chatOnKeypress($event, chatMsg)" />'
                + '</div>',
		link: function($scope, elem, attrs) {
            var chatScrollBox = document.getElementById('chatScrollBox');
            // ios touch workaround
            chatScrollBox.addEventListener('touchmove', function(e) {
                if (e.currentTarget.scrollTop == 0) {
                    e.currentTarget.scrollTop = 1;
                }
                else if (e.currentTarget.scrollHeight === e.currentTarget.scrollTop + e.currentTarget.offsetHeight) {
                    e.currentTarget.scrollTop -= 1;
                }

                e.stopPropagation();
            });

            $scope.chatMessages = [];
            $scope.filteredChatMessages = [];

            $scope.chatOnKeypress = function(e, chatMsg) {
                if (e.which === 13 && chatMsg) {
                    socket.emit('chatSend', { roomId: $scope.roomId, msg: chatMsg });
                    $scope.chatMsg = '';
                }
            }

            // Socket Events
            socket.on('chatNewMsg', function(data) {
                var needToScroll = chatScrollBox.scrollTop === chatScrollBox.scrollHeight - chatScrollBox.clientHeight;

                var chatData = {
                    text: data.name + ': ' + data.msg,
                    roomId: data.roomId,
                    timestamp: data.timestamp
                };
                $scope.chatMessages.push(chatData);
                
                if (data.roomId === $scope.roomId) {
                    $scope.filteredChatMessages.push(chatData);
                }

                if (needToScroll) {
                    setTimeout(function() { chatScrollBox.scrollTop = chatScrollBox.scrollHeight; }, 1);  // ASYNC Hack
                }
            });
            
            socket.on('chatNewGameMsg', function(data) {
                var needToScroll = chatScrollBox.scrollTop === chatScrollBox.scrollHeight - chatScrollBox.clientHeight;

                var chatData = {
                    text: data.msg,
                    roomId: data.roomId,
                    timestamp: data.timestamp
                };
                $scope.chatMessages.push(chatData);
                
                if (data.roomId === $scope.roomId) {
                    $scope.filteredChatMessages.push(chatData);
                }

                if (needToScroll) {
                    setTimeout(function() { chatScrollBox.scrollTop = chatScrollBox.scrollHeight; }, 1);  // ASYNC Hack
                }
            });

		}
	};
}]);