import api from './axiosConfig.js';

export const getCart = () => api.get('/cart');
export const addToCart = (productId, quantity) =>
  api.post('/cart/items', { productId: String(productId), quantity });
export const updateCartItem = (productId, quantity) =>
  api.patch(`/cart/items/${productId}`, { quantity });
export const removeFromCart = (productId) => api.delete(`/cart/items/${productId}`);
export const clearCart = () => api.delete('/cart');
