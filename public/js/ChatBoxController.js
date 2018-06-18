cardGameControllers.controller("ChatBoxCtrl", ["$scope", "socket", "$location",
    function ($scope, socket, $location) {
        $scope.chatMinimized = true;
        $scope.selectedTab = 0;
        $scope.newMessageIndicator = false;

        $scope.channelLabel = "Global";
        $scope.channel = "global";
        $scope.subChannel = "";
        $scope.target = "";
        $scope.roomId = "";
        
        $scope.lastWhisperSource = null;
        
        $scope.messages = [];
        $scope.lastLines = [];

        //$scope.messages.push({ from: "User100", channel: "global", text: "This is the test message." });
        //$scope.messages.push({ from: "User101", channel: "global", text: "Second test message." });
        
        socket.on("newMessage", function (data) {
            $scope.messages.push({ from: data.from, to: data.to, text: data.msg, channel: data.channel });

            if ($scope.chatMinimized) {
                $scope.newMessageIndicator = true;
            }

            if (data.channel === "whisper") {
                $scope.lastWhisperSource = data.from;
            }
        });

        // New and modern :)
        socket.on("chatMessage", function (data) {
            console.log(data);
            $scope.messages.push({ from: data.from, to: data.to, text: data.message, channel: $scope.channel });
        });

        socket.on("chatLog", function (data) {
            $scope.messages.push({ from: data.from, to: data.to, text: data.message, channel: $scope.channel });
        });

        socket.on("chatError", function (data) {
            $scope.messages.push({ from: data.from, to: data.to, text: data.message, channel: $scope.channel });
        });
        
        $scope.sendMessage = function (msg, $event) {
            var clear = false;
            
            //console.log($event);

            if ($event.keyCode === 38) {
                var lines = $scope.lastLines;
                if (lines.length > 0) {
                    // TODO: iterate
                    $scope.newMsg = lines[lines.length - 1];
                }
            }
            else if ($scope.newMsg) {
                if ($event.keyCode === 13 || $event.charCode === 32) {
                    var send = false;

                    if ($scope.newMsg[0] === "/") {
                        var cmds = $scope.newMsg.split(" ");
                        
                        if ($event.keyCode === 13 && (cmds[0] === "/help" || cmds[0] === "/h" || cmds[0] === "/?")) {
                            $scope.messages.push({ from: "System", text: "There is no help.", channel: "client-info" });
                            clear = true;
                        }
                        else if (cmds[0] === "/w") {
                            if (cmds[1]) {
                                $scope.channel = "whisper";
                                $scope.target = cmds[1];
                                $scope.channelLabel = cmds[1];
                                clear = true;
                            }
                            // no clear
                        }
                        else if (cmds[0] === "/r" && $scope.lastWhisperSource) {
                            $scope.channel = "whisper";
                            $scope.target = $scope.lastWhisperSource;
                            $scope.channelLabel = $scope.lastWhisperSource;
                            $scope.subChannel = $scope.lastWhisperSource;
                            clear = true;
                        }
                        else if (cmds[0] === "/global") {
                            $scope.channel = "global";
                            $scope.channelLabel = "Global";
                            $scope.subChannel = "";
                            clear = true;
                        }
                        else if (cmds[0] === "/game") {
                            $scope.channel = "game";
                            $scope.channelLabel = "Game";
                            $scope.subChannel = "all";
                            clear = true;
                        }
                        else if (cmds[0] === "/lobby") {
                            $scope.channel = "lobby";
                            $scope.channelLabel = "Lobby";
                            $scope.subChannel = "";
                            clear = true;
                        }
                        else if (cmds[0] === "/team") {
                            $scope.channel = "team";
                            $scope.channelLabel = "Team";
                            $scope.subChannel = "team";
                            clear = true;
                        }
                        else {
                            if ($event.keyCode === 13) {
                                clear = true;
                            }
                        }
                    
                    }
                    else if ($event.keyCode === 13) {
                        send = true;
                    }
                }
                
                // Execute
                if (send) {
                    var channel = $scope.channel;
                    var abort = false;

                    if (channel === "lobby" || channel === "game") {
                        var path = $location.path();
                        if (channel === "lobby" && path.indexOf("/lobby") !== 0) {
                            $scope.messages.push({ from: "System", text: "Lobby channel not available.", channel: "client-warning" });
                            abort = true;
                            clear = true;
                        }
                        else if (channel === "game" && path.indexOf("/game") !== 0) {
                            $scope.messages.push({ from: "System", text: "Game channel not available.", channel: "client-warning" });
                            abort = true;
                            clear = true;
                        }
                    }
                    
                    if (!abort) {
                        var target = null;
                        var roomId = null;
                        var subChannel = $scope.subChannel;
                    
                        if (channel === "whisper") {
                            target = $scope.target;
                        }
                        else if (channel === "lobby") {
                            roomId = $location.path().split("/")[2];
                        }
                        else if (channel === "game") {
                            roomId = $location.path().split("/")[3];
                        }
                        else if (channel === "team") {
                            roomId = $location.path().split("/")[3];
                        }
                        // socket.emit("chatAction", { channel: channel, target: target, roomId: roomId, msg: msg });
                        console.log(subChannel);
                        socket.emit("chatEvent", { channel: channel, channelId: roomId, subChannel: subChannel, message: msg});
                        clear = true;
                    }
                }
                
                if (clear) {
                    $scope.lastLines.push($scope.newMsg);
                    $scope.newMsg = "";
                    $event.preventDefault();
                }
            }
        }
        
        $scope.minimize = function () {
            $scope.chatMinimized = true;
        }

        $scope.maximize = function () {
            $scope.chatMinimized = false;
            $scope.newMessageIndicator = false;
        }
        
        $scope.selectTab = function (tab) {
            $scope.selectedTab = tab;
        }
        
        $scope.startResize = function ($e) {
            var startX = $e.clientX;
            var startY = $e.clientY;
            
            var element = $e.target.parentElement;
            var startWidth = parseInt(element.style.width);
            var startHeight = parseInt(element.style.height);
            
            if (!startWidth || !startHeight) {
                startWidth = 600;
                startHeight = 230;
            }

            function onResizing(e) {
                if ((startWidth + e.clientX - startX) > 300) {
                    element.style.width = (startWidth + e.clientX - startX) + "px";
                }

                if ((startHeight - e.clientY + startY) > 100) {
                    element.style.height = (startHeight - e.clientY + startY) + "px";
                }
            }
            
            function onResizeEnd() {
                document.removeEventListener('mousemove', onResizing, false);
                document.removeEventListener('mouseup', onResizeEnd, false);
            }

            document.addEventListener('mousemove', onResizing, false);
            document.addEventListener('mouseup', onResizeEnd, false);

            // Disable selectionStart
            $e.preventDefault();
        }
        
        $scope.startMove = function ($e) {
            var startX = $e.clientX;
            var startY = $e.clientY;
            
            var element = $e.target.parentElement;
            var startLeft = parseInt(element.style.left);
            var startBottom = parseInt(element.style.bottom);
            
            if (!startLeft || !startBottom) {
                startLeft = 20;
                startBottom = 20;
            }
            
            function onMoving(e) {
                if ((startLeft + e.clientX - startX) > 0) {
                    element.style.left = (startLeft + e.clientX - startX) + "px";
                }
                
                if ((startBottom - e.clientY + startY) > 0) {
                    element.style.bottom = (startBottom - e.clientY + startY) + "px";
                }
            }
            
            function onMoveEnd() {
                document.removeEventListener('mousemove', onMoving, false);
                document.removeEventListener('mouseup', onMoveEnd, false);
            }
            
            document.addEventListener('mousemove', onMoving, false);
            document.addEventListener('mouseup', onMoveEnd, false);
            
            // Disable selectionStart
            $e.preventDefault();
        }

        // Destructor
        $scope.$on('$destroy', function (e) {
            socket.off("newMessage");
        });
    }
]);