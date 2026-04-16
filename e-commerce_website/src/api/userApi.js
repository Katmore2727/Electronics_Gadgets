import api from './axiosConfig.js';

export const getAllCustomers = (params) => api.get('/admin/users', { params });
export const getAssignedUsers = (params) => api.get('/admin/users/assigned', { params });
export const assignUserToAdmin = (userId, data) => api.patch(`/admin/users/${userId}/assign`, data);