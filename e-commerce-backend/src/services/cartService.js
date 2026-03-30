import * as Cart from '../models/Cart.js';
import * as Product from '../models/Product.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Get or create cart for user and return cart with items
 */
const getCartWithItems = async (userId) => {
  const cart = await Cart.getOrCreateCart(userId);
  const items = await Cart.getCartItems(cart.id);
  return { cart, items };
};

/**
 * Format cart response
 */
const formatCartResponse = (cart, items) => {
  const subtotal = items.reduce(
    (sum, item) => sum + parseFloat(item.price) * item.quantity,
    0
  );
  return {
    cart: { id: cart.id, userId: cart.user_id },
    items: items.map((i) => ({
      id: i.id,
      productId: i.product_id,
      name: i.name,
      slug: i.slug,
      price: parseFloat(i.price),
      quantity: i.quantity,
      subtotal: parseFloat(i.price) * i.quantity,
      images: i.images,
      brand: i.brand,
      stockQuantity: i.stock_quantity,
    })),
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
    subtotal: Math.round(subtotal * 100) / 100,
  };
};

/**
 * Get cart items
 */
export const getCart = async (userId) => {
  const { cart, items } = await getCartWithItems(userId);
  return formatCartResponse(cart, items);
};

/**
 * Add to cart
 */
export const addToCart = async (userId, productId, quantity) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw ApiError.notFound('Product not found');
  }
  if (product.status !== 'active') {
    throw ApiError.badRequest('Product is not available');
  }
  if (product.stock_quantity < quantity) {
    throw ApiError.badRequest(
      `Insufficient stock. Available: ${product.stock_quantity}`
    );
  }

  const cart = await Cart.getOrCreateCart(userId);
  await Cart.addItem(cart.id, productId, quantity);
  const items = await Cart.getCartItems(cart.id);
  return formatCartResponse(cart, items);
};

/**
 * Update cart item quantity
 */
export const updateQuantity = async (userId, productId, quantity) => {
  const cart = await Cart.getOrCreateCart(userId);
  const existing = await Cart.getCartItem(cart.id, productId);
  if (!existing) {
    throw ApiError.notFound('Item not in cart');
  }

  const product = await Product.findById(productId);
  if (product && product.stock_quantity < quantity) {
    throw ApiError.badRequest(
      `Insufficient stock. Available: ${product.stock_quantity}`
    );
  }

  const updated = await Cart.updateItemQuantity(cart.id, productId, quantity);
  if (!updated) {
    throw ApiError.badRequest('Quantity must be greater than 0');
  }

  const items = await Cart.getCartItems(cart.id);
  return formatCartResponse(cart, items);
};

/**
 * Remove from cart
 */
export const removeFromCart = async (userId, productId) => {
  const cart = await Cart.getOrCreateCart(userId);
  const removed = await Cart.removeItem(cart.id, productId);
  if (!removed) {
    throw ApiError.notFound('Item not in cart');
  }
  const items = await Cart.getCartItems(cart.id);
  return formatCartResponse(cart, items);
};

/**
 * Clear cart
 */
export const clearCart = async (userId) => {
  const cart = await Cart.getOrCreateCart(userId);
  await Cart.clearCart(cart.id);
  return formatCartResponse(cart, []);
};
