import api from "./api";

export const getProfile = async () => {
    const response = await api.get("/api/profile");
    return response.data;
};

export const updateName = async (name) => {
    const response = await api.put("/api/profile/name", { name });
    return response.data;
};

export const updateUsername = async (username) => {
    const response = await api.put("/api/profile/username", { username });
    return response.data;
};

export const updateTheme = async (theme) => {
    const response = await api.put("/api/profile/theme", { theme });
    return response.data;
};

export const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await api.post("/api/profile/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
};
