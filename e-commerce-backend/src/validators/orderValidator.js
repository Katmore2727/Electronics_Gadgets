import Joi from 'joi';

const addressSchema = Joi.object({
  street: Joi.string().required().trim(),
  city: Joi.string().required().trim(),
  state: Joi.string().optional().trim().allow(''),
  postalCode: Joi.string().required().trim(),
  country: Joi.string().required().trim(),
  phone: Joi.string().optional().trim().allow(''),
});

export const createOrderSchema = Joi.object({
  shippingAddress: addressSchema.required(),
  billingAddress: addressSchema.required(),
  paymentMethod: Joi.string().valid('cod', 'upi', 'card', 'netbanking').required(),
  notes: Joi.string().max(500).optional().trim().allow(''),
});

export const updateStatusSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')
    .required(),
});

export const orderIdParamSchema = Joi.object({
  id: Joi.string().pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'Order ID must be a positive integer',
  }),
});

export const orderHistoryQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
});

export const cancelOrderSchema = Joi.object({
  reason: Joi.string()
    .valid(
      'Changed my mind',
      'Ordered by mistake',
      'Found a better price elsewhere',
      'Delivery is taking too long',
      'Need to change address or payment method',
      'Want to change product or quantity'
    )
    .required(),
  confirmation: Joi.boolean().valid(true).required(),
});
