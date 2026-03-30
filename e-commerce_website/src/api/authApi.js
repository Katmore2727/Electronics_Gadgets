import api from './axiosConfig.js';

export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const logout = (refreshToken) => api.post('/auth/logout', { refreshToken });
export const getMe = () => api.get('/auth/me');
export const refreshToken = (refreshToken) => api.post('/auth/refresh', { refreshToken });
