import axios from 'axios';

const trimTrailingSlash = (value = '') => value.replace(/\/+$/, '');

const configuredBaseUrl = trimTrailingSlash(import.meta.env.VITE_API_BASE_URL || '/api');
const rawAppBaseUrl = trimTrailingSlash(import.meta.env.VITE_APP_BASE_URL || '');

export const API_BASE_URL = configuredBaseUrl;
export const APP_BASE_URL = rawAppBaseUrl;
export const buildApiUrl = (path = '') => `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
export const buildAppUrl = (path = '') => `${APP_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(buildApiUrl('/auth/refresh'), { refreshToken });
          localStorage.setItem('accessToken', data.data.accessToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          err.config.headers.Authorization = `Bearer ${data.data.accessToken}`;
          return api(err.config);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(err);
  }
);

export default api;
