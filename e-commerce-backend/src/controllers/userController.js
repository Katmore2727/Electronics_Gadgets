import * as userService from '../services/userService.js';
import { USER_ROLES } from '../models/User.js';

/**
 * GET /api/admin/users - Get all customers for assignment
 */
export const getAllCustomers = async (req, res) => {
  const customers = await userService.getAllCustomers();
  res.json({
    success: true,
    data: customers,
  });
};

/**
 * GET /api/admin/users/assigned - Get users assigned to current admin
 */
export const getAssignedUsers = async (req, res) => {
  const users = await userService.getAssignedUsers(req.user.id);
  res.json({
    success: true,
    data: users,
  });
};

/**
 * PATCH /api/admin/users/:id/assign - Assign user to admin
 */
export const assignUser = async (req, res) => {
  const { adminId } = req.body;
  const user = await userService.assignUserToAdmin(req.params.id, adminId || req.user.id);
  res.json({
    success: true,
    message: 'User assigned successfully',
    data: user,
  });
};