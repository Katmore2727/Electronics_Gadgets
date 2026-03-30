import * as cartService from '../services/cartService.js';

/**
 * GET /api/cart - Get cart items
 */
export const getCart = async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  res.json({
    success: true,
    data: cart,
  });
};

/**
 * POST /api/cart/items - Add to cart
 */
export const addItem = async (req, res) => {
  const { productId, quantity } = req.body;
  const cart = await cartService.addToCart(req.user.id, productId, quantity);
  res.status(201).json({
    success: true,
    message: 'Item added to cart',
    data: cart,
  });
};

/**
 * PATCH /api/cart/items/:productId - Update quantity
 */
export const updateQuantity = async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;
  const cart = await cartService.updateQuantity(
    req.user.id,
    productId,
    quantity
  );
  res.json({
    success: true,
    message: 'Cart updated',
    data: cart,
  });
};

/**
 * DELETE /api/cart/items/:productId - Remove from cart
 */
export const removeItem = async (req, res) => {
  const { productId } = req.params;
  const cart = await cartService.removeFromCart(req.user.id, productId);
  res.json({
    success: true,
    message: 'Item removed from cart',
    data: cart,
  });
};

/**
 * DELETE /api/cart - Clear cart
 */
export const clearCart = async (req, res) => {
  const cart = await cartService.clearCart(req.user.id);
  res.json({
    success: true,
    message: 'Cart cleared',
    data: cart,
  });
};
