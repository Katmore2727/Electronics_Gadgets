import * as User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Assign a customer to an admin
 */
export const assignUserToAdmin = async (userId, adminId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }
  if (user.role !== User.USER_ROLES.CUSTOMER) {
    throw ApiError.badRequest('Can only assign customers to admins');
  }

  return User.assignToAdmin(userId, adminId);
};

/**
 * Get users assigned to an admin
 */
export const getAssignedUsers = async (adminId) => {
  return User.getAssignedUsers(adminId);
};

/**
 * Get all customers (for admin assignment)
 */
export const getAllCustomers = async () => {
  return User.getAllCustomers();
};