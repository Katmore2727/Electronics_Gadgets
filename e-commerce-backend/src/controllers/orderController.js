import * as orderService from '../services/orderService.js';
import { USER_ROLES } from '../models/User.js';

/**
 * POST /api/orders - Create order from cart
 */
export const create = async (req, res) => {
  const { shippingAddress, billingAddress, paymentMethod, notes } = req.body;
  const order = await orderService.createOrderFromCart(req.user.id, {
    shippingAddress,
    billingAddress,
    paymentMethod,
    notes,
  });
  res.status(201).json({
    success: true,
    message: 'Order placed successfully',
    data: order,
  });
};

/**
 * GET /api/orders - Order history for user
 */
export const getHistory = async (req, res) => {
  const { page, limit } = req.query;
  const result = await orderService.getOrderHistory(req.user.id, {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 20,
  });
  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
};

export const getAll = async (req, res) => {
  const { page, limit } = req.query;
  const result = await orderService.getAllOrders(req.user.id, {
    page: page ? parseInt(page, 10) : 1,
    limit: limit ? parseInt(limit, 10) : 20,
  });
  res.json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
};

/**
 * GET /api/orders/:id - Get order by ID
 */
export const getById = async (req, res) => {
  const isAdmin = req.user.role === USER_ROLES.ADMIN;
  const order = await orderService.getOrderById(
    req.params.id,
    req.user.id,
    isAdmin
  );
  res.json({
    success: true,
    data: order,
  });
};

/**
 * PATCH /api/orders/:id/status - Update order status (admin only)
 */
export const updateStatus = async (req, res) => {
  const { status } = req.body;
  const order = await orderService.updateOrderStatus(req.params.id, status);
  res.json({
    success: true,
    message: 'Order status updated',
    data: order,
  });
};

export const cancel = async (req, res) => {
  const { reason } = req.body;
  const order = await orderService.cancelOrderByUser(req.params.id, req.user.id, reason);
  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: order,
  });
};
