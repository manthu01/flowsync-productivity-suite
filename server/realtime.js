const { Server } = require("socket.io");
const { verifySessionToken, loadSession } = require("./utils/session");
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
    // Same session check as requireAuth, including token_version, so a reset
    // password also cuts off live updates for old sessions.
    io.use(async (socket, next) => {
        const payload = verifySessionToken(socket.handshake.auth?.token);
        if (!payload) return next(new Error("Invalid or expired token"));

        try {
            const session = await loadSession(payload);
            if (!session) return next(new Error("Invalid or expired token"));
            socket.userId = session.id;
            next();
        } catch (err) {
            logger.error({ err }, "Socket session lookup failed");
            next(new Error("Something went wrong"));
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
