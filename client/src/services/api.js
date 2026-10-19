import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const api = axios.create({
    baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("flowsync_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// A 401 on a signed-in request means the session is gone (expired, or revoked by a
// password reset elsewhere), so sign out everywhere in this tab and go to login.
// Auth endpoints are skipped: a 401 there is just "wrong password".
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const isAuthEndpoint = error.config?.url?.startsWith("/api/auth/");
        if (error.response?.status === 401 && !isAuthEndpoint && localStorage.getItem("flowsync_token")) {
            // Lazy import: authService imports this module.
            const { logout } = await import("./authService");
            logout();
            if (window.location.pathname !== "/login") {
                window.location.assign("/login");
            }
        }
        return Promise.reject(error);
    }
);

export default api;
