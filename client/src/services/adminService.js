import api from "./api";

export const getAdminStats = async () => {
    const response = await api.get("/api/admin/stats");
    return response.data;
};
