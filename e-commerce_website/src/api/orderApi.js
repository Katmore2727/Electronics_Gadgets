import api from './axiosConfig.js';

export const createOrder = (data) => api.post('/orders', data);
export const getOrderHistory = (params) => api.get('/orders', { params });
export const getOrder = (id) => api.get(`/orders/${id}`);
export const cancelOrder = (id, data) => api.patch(`/orders/${id}/cancel`, data);
export const getAdminOrders = (params) => api.get('/orders/admin/all', { params });
export const updateOrderStatus = (id, data) => api.patch(`/orders/${id}/status`, data);
