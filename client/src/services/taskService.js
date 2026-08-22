import api from "./api";

const TASKS_URL = "/api/tasks";

export const getTasks = async () => {
    const response = await api.get(TASKS_URL);
    return response.data;
};

export const createTask = async (taskData) => {
    const response = await api.post(TASKS_URL, taskData);
    return response.data;
};

export const deleteTask = async (id) => {
    const response = await api.delete(`${TASKS_URL}/${id}`);
    return response.data;
};

export const updateTaskStatus = async (id, status) => {
    const response = await api.put(`${TASKS_URL}/${id}`, status);
    return response.data;
};
