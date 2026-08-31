import api from "./api";

export const getFriends = async () => {
    const response = await api.get("/api/friends");
    return response.data;
};

export const getPendingRequests = async () => {
    const response = await api.get("/api/friends/pending");
    return response.data;
};

export const sendFriendRequest = async (username) => {
    const response = await api.post("/api/friends/request", { username });
    return response.data;
};

export const acceptFriendRequest = async (requestId) => {
    const response = await api.post(`/api/friends/requests/${requestId}/accept`);
    return response.data;
};

export const removeFriendRequest = async (requestId) => {
    const response = await api.delete(`/api/friends/requests/${requestId}`);
    return response.data;
};

export const removeFriend = async (friendId) => {
    const response = await api.delete(`/api/friends/${friendId}`);
    return response.data;
};

export const starFriend = async (friendId) => {
    const response = await api.post(`/api/friends/${friendId}/star`);
    return response.data;
};

export const unstarFriend = async (friendId) => {
    const response = await api.delete(`/api/friends/${friendId}/star`);
    return response.data;
};
