import { ApiError } from '../utils/ApiError.js';

/**
 * Validate request body/params/query against Joi schema
 * @param {Object} schema - Joi schema with keys: body, params, query
 * @param {string} source - 'body' | 'params' | 'query'
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const data = req[source];
    const schemas = Array.isArray(schema) ? schema : [schema];

    for (const s of schemas) {
      const { error, value } = s.validate(data, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map((d) => ({
          field: d.path.join('.'),
          message: d.message,
        }));
        return next(ApiError.badRequest('Validation failed', errors));
      }

      req[source] = value;
    }

    next();
  };
};
