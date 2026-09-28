import { io } from "socket.io-client";
import { API_BASE_URL } from "./api";
import { getToken } from "./authService";

let socket = null;

// One shared connection for the whole app, authenticated with the same JWT used for
// REST calls. Safe to call repeatedly — reuses the existing connection if there is one.
export const connectSocket = () => {
    const token = getToken();
    if (!token) return null;

    if (socket?.connected) return socket;

    socket = io(API_BASE_URL, {
        auth: { token },
        transports: ["websocket", "polling"],
    });

    return socket;
};

export const disconnectSocket = () => {
    socket?.disconnect();
    socket = null;
};

export const getSocket = () => socket;
