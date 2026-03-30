import api from './axiosConfig.js';

export const getProducts = (params) => api.get('/products', { params });
export const getProduct = (id) => api.get(`/products/${id}`);
export const getRecommendations = (id, limit = 5) =>
  api.get(`/products/${id}/recommendations`, { params: { limit } });
export const getCategories = () => api.get('/products/categories/list');
export const getBrands = () => api.get('/products/brands/list');

// Reviews
export const getReviews = (productId, params) => 
  api.get(`/reviews/${productId}`, { params });
export const getMyReview = (productId) => 
  api.get(`/reviews/${productId}/my-review`);
export const createReview = (productId, data) => 
  api.post(`/reviews/${productId}`, data);
export const deleteReview = (reviewId) => 
  api.delete(`/reviews/${reviewId}`);
