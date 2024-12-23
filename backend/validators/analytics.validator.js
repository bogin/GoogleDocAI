const { body } = require('express-validator');

exports.validateAnalyticsQuery = [
    body('query')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Query is required')
        .isLength({ max: 1000 })
        .withMessage('Query must not exceed 1000 characters')
        .matches(/^[a-zA-Z0-9\s\-_.,?!(){}[\]"']+$/)
        .withMessage('Query contains invalid characters')
        .escape(),

    body('filters')
        .optional()
        .isObject()
        .withMessage('Filters must be an object if provided'),

    body('options')
        .optional()
        .isObject()
        .withMessage('Options must be an object if provided'),

    body('options.timeout')
        .optional()
        .isInt({ min: 1000, max: 30000 })
        .withMessage('Timeout must be between 1000 and 30000 ms'),

    body('options.cache')
        .optional()
        .isBoolean()
        .withMessage('Cache must be a boolean value')
];