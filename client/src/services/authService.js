import api from "./api";

export const signup = async ({ name, username, email, password }) => {
    const response = await api.post("/api/auth/signup", { name, username, email, password });
    return response.data;
};

export const login = async ({ identifier, password }) => {
    const response = await api.post("/api/auth/login", { identifier, password });
    return response.data;
};

export const forgotPassword = async (email) => {
    const response = await api.post("/api/auth/forgot-password", { email });
    return response.data;
};

export const resetPassword = async (token, password) => {
    const response = await api.post("/api/auth/reset-password", { token, password });
    return response.data;
};

export const logout = () => {
    localStorage.removeItem("flowsync_token");
    localStorage.removeItem("flowsync_user");
};

export const getToken = () => localStorage.getItem("flowsync_token");

export const getStoredUser = () => {
    const raw = localStorage.getItem("flowsync_user");
    return raw ? JSON.parse(raw) : null;
};

// Merges partial changes (e.g. a new name, avatar, or username) into the cached user
// object so the navbar and other reads of getStoredUser() reflect edits immediately,
// without waiting for the next login.
export const updateStoredUser = (partial) => {
    const current = getStoredUser();
    if (!current) return;
    localStorage.setItem("flowsync_user", JSON.stringify({ ...current, ...partial }));
};
