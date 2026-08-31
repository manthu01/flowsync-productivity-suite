import api from "./api";

const base = (taskId) => `/api/tasks/${taskId}/subtasks`;

export const getSubtasks = async (taskId) => {
    const response = await api.get(base(taskId));
    return response.data;
};

export const createSubtask = async (taskId, title) => {
    const response = await api.post(base(taskId), { title });
    return response.data;
};

export const updateSubtask = async (taskId, subtaskId, updates) => {
    const response = await api.put(`${base(taskId)}/${subtaskId}`, updates);
    return response.data;
};

export const deleteSubtask = async (taskId, subtaskId) => {
    const response = await api.delete(`${base(taskId)}/${subtaskId}`);
    return response.data;
};
