"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const session = require("express-session");
const cookieParser = require("cookie-parser");
const cookie = require("cookie");
const http = require("http");
const ioServer = require("socket.io");
const shortId = require("shortid");
const MemoryStore = session.MemoryStore;
const app = express();
const server = http.createServer(app);
const io = ioServer(server);
const cookieSecret = "mySecret";
app.use(cookieParser());
app.use(session({
    secret: cookieSecret,
    store: new MemoryStore(),
    name: "connect.sid",
    cookie: {
        expires: new Date(Date.now() + (30 * 86400 * 1000))
    },
    saveUninitialized: true,
    resave: true
}));
app.use(express.static(__dirname + "/public"));
// === Logic ===
// =============
const User_1 = require("./server/User");
const UserManager_1 = require("./server/UserManager");
const GlobalChatController_1 = require("./server/chat/GlobalChatController");
const GameBrowser_1 = require("./server/GameBrowser");
const GamesController_1 = require("./server/GamesController");
const LobbyController_1 = require("./server/lobby/LobbyController");
const LobbyManager_1 = require("./server/lobby/LobbyManager");
const gamesManager_1 = require("./server/gamesManager");
const RiskGame_1 = require("./server/games/Risk/RiskGame");
const MauMauGame_1 = require("./server/games/mau-mau/MauMauGame");
const SecretHitlerGame_1 = require("./server/games/secret-hitler/SecretHitlerGame");
const RTSGame_1 = require("./server/games/rts-prototype/RTSGame");
const SpaceBridgeGame_1 = require("./server/games/space-bridge/SpaceBridgeGame");
// === Socket.io ===
// =================
const gamesManager = new gamesManager_1.GamesManager();
const lobbyManager = new LobbyManager_1.LobbyManager();
const userManager = new UserManager_1.UserManager();
gamesManager.registerTimerEvents();
gamesManager.addSelectableGame(MauMauGame_1.MauMauGame);
gamesManager.addSelectableGame(RiskGame_1.RiskGame);
gamesManager.addSelectableGame(SecretHitlerGame_1.SecretHitlerGame);
gamesManager.addSelectableGame(RTSGame_1.RTSGame);
gamesManager.addSelectableGame(SpaceBridgeGame_1.SpaceBridgeGame);
console.log("Server is running");
// Parse cookies for socket io
io.use((socket, next) => {
    if (socket.request.headers.cookie) {
        socket.request.cookies = cookie.parse(socket.request.headers.cookie);
    }
    // TODO: Else handle error
    next();
});
io.on("connection", (socket) => {
    // Session data
    const sessionId = socket.request.cookies["connect.sid"];
    const ipAddress = socket.handshake.address;
    let currentUser = userManager.getUserBySessionId(sessionId);
    if (currentUser !== null) {
        // TODO: Reload chats?
        console.log("User reconnected:", currentUser.sessionId, "from", ipAddress);
    }
    else {
        const userId = shortId.generate();
        currentUser = userManager.addUser(sessionId, userId);
        console.log("New user connected:", currentUser.sessionId, "from", ipAddress);
        if (ipAddress === "::1" || ipAddress === "::ffff:127.0.0.1") {
            currentUser.role = User_1.Role.Dev;
        }
    }
    // Link socket to user
    currentUser.addSocket(socket);
    socket.emit("initUser", { name: currentUser.name, id: currentUser.id });
    // socket.emit()			- Nur Socket
    // socket.broadcast.emit()	- An alle außer Socket
    // io.sockets.emit()		- An alle
    // === General ===
    // ===============
    socket.on("changeUsername", (name) => {
        const regex = /^\w+$/;
        if (name && regex.test(name) && name.length <= 12) {
            currentUser.name = name;
            socket.emit("initUser", { name: name, id: currentUser.id });
        }
        else {
            console.log("Server - setUsername: Invalid name.");
        }
        if (name === "Admin") {
            currentUser.role = User_1.Role.Dev;
        }
    });
    // === Chat ===
    // ============
    (new GlobalChatController_1.GlobalChatController(io, socket, lobbyManager, gamesManager, userManager, currentUser)).registerEvents();
    // === Gamebrowser ===
    // ===================
    (new GameBrowser_1.default(io, socket, lobbyManager, gamesManager, currentUser)).registerEvents();
    // === Lobby ===
    // =============
    (new LobbyController_1.LobbyController(io, socket, lobbyManager, gamesManager, userManager, currentUser)).registerEvents();
    // === Gamescontroller ===
    // =======================
    (new GamesController_1.default(io, socket, gamesManager, currentUser)).registerEvents();
    // === Exit ===
    // ============
    socket.on("disconnect", () => {
        currentUser.removeSocket(socket);
    });
});
server.listen(8080);
//# sourceMappingURL=server.js.map