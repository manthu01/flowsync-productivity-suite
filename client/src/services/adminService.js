import api from "./api";

export const getAdminStats = async () => {
    const response = await api.get("/api/admin/stats");
    return response.data;
};

export const getAdminUsers = async () => {
    const response = await api.get("/api/admin/users");
    return response.data;
};

export const setUserPassword = async (userId, password) => {
    const response = await api.put(`/api/admin/users/${userId}/password`, { password });
    return response.data;
};

export const getAdminContactMessages = async () => {
    const response = await api.get("/api/admin/contact-messages");
    return response.data;
};
