const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const logger = require("./utils/logger");

let io = null;

// Each connected client joins a room named after their own user id. Broadcasting a
// change to "everyone who can see this task" is then just emitting to the rooms of
// the owner + every collaborator — no need to track socket ids per user manually.
const userRoom = (userId) => `user:${userId}`;

const attachRealtime = (httpServer) => {
    const allowedOrigins = process.env.CLIENT_URL
        ? process.env.CLIENT_URL.split(",").map((url) => url.trim())
        : true;

    io = new Server(httpServer, {
        cors: { origin: allowedOrigins },
    });

    // Same JWT already used for the REST API — passed via the socket handshake
    // instead of a header, since the initial connection isn't a normal HTTP request.
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("No token provided"));

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.userId = decoded.id;
            next();
        } catch {
            next(new Error("Invalid or expired token"));
        }
    });

    io.on("connection", (socket) => {
        socket.join(userRoom(socket.userId));
    });

    return io;
};

// Notifies every user who can see a task (its owner plus current collaborators) that
// something about it changed, so their clients can refetch. Deliberately payload-free
// — a refetch is simpler and more robust than trying to keep partial client state in
// sync with every possible mutation shape.
const notifyTaskChanged = (userIds) => {
    if (!io) return;
    for (const userId of userIds) {
        io.to(userRoom(userId)).emit("tasks:changed");
    }
};

module.exports = { attachRealtime, notifyTaskChanged };
