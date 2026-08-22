import api from "./api";

export const signup = async ({ name, email, password }) => {
    const response = await api.post("/api/auth/signup", { name, email, password });
    return response.data;
};

export const login = async ({ email, password }) => {
    const response = await api.post("/api/auth/login", { email, password });
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
