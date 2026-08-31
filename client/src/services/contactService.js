import api from "./api";

export const sendContactMessage = async ({ name, email, message }) => {
    const response = await api.post("/api/contact", { name, email, message });
    return response.data;
};
