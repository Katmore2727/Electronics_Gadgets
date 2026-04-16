import pool from '../config/database.js';
import * as Cart from '../models/Cart.js';
import * as Order from '../models/Order.js';
import { ApiError } from '../utils/ApiError.js';

const TAX_RATE = 0;
const SHIPPING_COST = 0;

/**
 * Create order from cart (atomic transaction)
 */
export const createOrderFromCart = async (userId, data) => {
  const cart = await Cart.getOrCreateCart(userId);
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const cartItems = await Cart.getCartItemsForOrder(client, cart.id);

    if (!cartItems.length) {
      throw ApiError.badRequest('Cart is empty');
    }

    const orderItems = [];
    let subtotal = 0;
    const stockErrors = [];

    for (const item of cartItems) {
      if (item.status !== 'active') {
        stockErrors.push(`${item.name} is no longer available`);
        continue;
      }
      if (item.stock_quantity < item.quantity) {
        stockErrors.push(
          `${item.name}: insufficient stock (available: ${item.stock_quantity})`
        );
        continue;
      }

      const unitPrice = parseFloat(item.price);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;

      orderItems.push({
        productId: item.product_id,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        productSnapshot: {
          name: item.name,
          price: item.price,
          sku: item.sku,
          brand: item.brand,
          images: item.images,
        },
      });
    }

    if (stockErrors.length > 0) {
      throw ApiError.badRequest('Order validation failed', stockErrors);
    }

    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const shippingCost = SHIPPING_COST;
    const total = Math.round((subtotal + tax + shippingCost) * 100) / 100;
    const orderNumber = Order.generateOrderNumber();

    const order = await Order.createOrder(client, {
      userId,
      orderNumber,
      subtotal,
      tax,
      shippingCost,
      total,
      shippingAddress: data.shippingAddress,
      billingAddress: data.billingAddress,
      paymentMethod: data.paymentMethod,
      notes: data.notes,
    });

    for (const oi of orderItems) {
      await Order.createOrderItem(client, {
        orderId: order.id,
        productId: oi.productId,
        quantity: oi.quantity,
        unitPrice: oi.unitPrice,
        totalPrice: oi.totalPrice,
        productSnapshot: oi.productSnapshot,
      });
      const deducted = await Order.deductStock(client, oi.productId, oi.quantity);
      if (!deducted) {
        throw ApiError.conflict(
          `Insufficient stock for product ${oi.productSnapshot.name}. Another order may have been placed.`
        );
      }
    }

    await Cart.clearCartItems(client, cart.id);
    await client.query('COMMIT');

    const fullOrder = await Order.findById(order.id);
    return fullOrder;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Get order by ID (user's own or admin)
 */
export const getOrderById = async (orderId, userId, isAdmin = false) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }
  if (!isAdmin && order.user_id !== userId) {
    throw ApiError.forbidden('Access denied');
  }
  return order;
};

/**
 * Get order history for user
 */
export const getOrderHistory = async (userId, options = {}) => {
  return Order.findByUserId(userId, options);
};

export const getAllOrders = async (adminId, options = {}) => {
  return Order.findAll(adminId, options);
};

/**
 * Update order status (admin only)
 */
export const updateOrderStatus = async (orderId, status) => {
  const validStatuses = [
    'pending',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
  ];
  if (!validStatuses.includes(status)) {
    throw ApiError.badRequest(
      `Invalid status. Allowed: ${validStatuses.join(', ')}`
    );
  }

  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  const transitionMap = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['processing', 'cancelled'],
    processing: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  };

  if (order.status === status) {
    return order;
  }

  if (!transitionMap[order.status]?.includes(status)) {
    throw ApiError.badRequest(
      `Cannot move an order from ${order.status} to ${status}.`
    );
  }

  return Order.updateStatus(orderId, status);
};

export const cancelOrderByUser = async (orderId, userId, reason) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw ApiError.notFound('Order not found');
  }

  if (order.user_id !== userId) {
    throw ApiError.forbidden('Access denied');
  }

  const cancellableStatuses = ['pending', 'confirmed', 'processing'];
  if (!cancellableStatuses.includes(order.status)) {
    throw ApiError.badRequest('This order can no longer be cancelled.');
  }

  const nextNotes = [order.notes, `Cancellation reason: ${reason}`]
    .filter(Boolean)
    .join('\n');

  const paymentStatus = order.payment_status === 'paid' ? 'refunded' : order.payment_status;
  await Order.updateStatusAndNotes(orderId, 'cancelled', nextNotes, paymentStatus);
  return Order.findById(orderId);
};
