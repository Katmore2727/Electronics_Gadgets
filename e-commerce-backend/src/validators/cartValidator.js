import Joi from 'joi';

export const addItemSchema = Joi.object({
  productId: Joi.string().pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'Product ID must be a positive integer',
  }),
  quantity: Joi.number().integer().min(1).required(),
});

export const updateQuantitySchema = Joi.object({
  quantity: Joi.number().integer().min(1).required(),
});

export const productIdParamSchema = Joi.object({
  productId: Joi.string().pattern(/^\d+$/).required().messages({
    'string.pattern.base': 'Product ID must be a positive integer',
  }),
});
