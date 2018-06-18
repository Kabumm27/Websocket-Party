import express = require("express");
import session = require("express-session");
import cookieParser = require("cookie-parser");
import cookie = require("cookie");
import http = require("http");
import ioServer = require("socket.io");
import shortId = require("shortid");

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
import { Role, User } from "./server/User";
import { UserManager } from "./server/UserManager";

import { GlobalChatController } from "./server/chat/GlobalChatController";

import GameBrowser from "./server/GameBrowser";
import GamesController from "./server/GamesController";

import { Lobby } from "./server/lobby/Lobby";
import { LobbyController } from "./server/lobby/LobbyController";
import { LobbyManager } from "./server/lobby/LobbyManager";

import { GamesManager } from "./server/gamesManager";
import { RiskGame } from "./server/games/Risk/RiskGame";
import { MauMauGame } from "./server/games/mau-mau/MauMauGame";
import { SecretHitlerGame } from "./server/games/secret-hitler/SecretHitlerGame";
import { RTSGame } from "./server/games/rts-prototype/RTSGame";
import { SpaceBridgeGame } from "./server/games/space-bridge/SpaceBridgeGame";


// === Socket.io ===
// =================
const gamesManager = new GamesManager();
const lobbyManager = new LobbyManager();
const userManager = new UserManager();


gamesManager.registerTimerEvents();

gamesManager.addSelectableGame(MauMauGame);
gamesManager.addSelectableGame(RiskGame);
gamesManager.addSelectableGame(SecretHitlerGame);
gamesManager.addSelectableGame(RTSGame);
gamesManager.addSelectableGame(SpaceBridgeGame);

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
            currentUser.role = Role.Dev;
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
    socket.on("changeUsername", (name: string) => {
        const regex = /^\w+$/;

        if (name && regex.test(name) && name.length <= 12) {
            currentUser.name = name;

            socket.emit("initUser", { name: name, id: currentUser.id });
        }
        else {
            console.log("Server - setUsername: Invalid name.");
        }

        if (name === "Admin") {
            currentUser.role = Role.Dev;
        }
    });

    // === Chat ===
    // ============
    (new GlobalChatController(io, socket, lobbyManager, gamesManager, userManager, currentUser)).registerEvents();
	
    // === Gamebrowser ===
    // ===================
    (new GameBrowser(io, socket, lobbyManager, gamesManager, currentUser)).registerEvents();
	

    // === Lobby ===
    // =============
    (new LobbyController(io, socket, lobbyManager, gamesManager, userManager, currentUser)).registerEvents();
	

    // === Gamescontroller ===
    // =======================
    (new GamesController(io, socket, gamesManager, currentUser)).registerEvents();

    // === Exit ===
    // ============
    socket.on("disconnect", () => {
        currentUser.removeSocket(socket);
    });
});


server.listen(8080);
