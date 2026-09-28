import api from "./api";

export const getAdminStats = async () => {
    const response = await api.get("/api/admin/stats");
    return response.data;
};

export const getAdminUsers = async ({ search = "", page = 1, pageSize = 20 } = {}) => {
    const response = await api.get("/api/admin/users", { params: { search, page, pageSize } });
    return response.data;
};

export const setUserPassword = async (userId, password) => {
    const response = await api.put(`/api/admin/users/${userId}/password`, { password });
    return response.data;
};

export const getAdminContactMessages = async ({ search = "", page = 1, pageSize = 20 } = {}) => {
    const response = await api.get("/api/admin/contact-messages", { params: { search, page, pageSize } });
    return response.data;
};

export const getAdminAuditLog = async ({ page = 1, pageSize = 20 } = {}) => {
    const response = await api.get("/api/admin/audit-log", { params: { page, pageSize } });
    return response.data;
};
