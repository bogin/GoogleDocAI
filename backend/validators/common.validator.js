const { body, param } = require('express-validator');

exports.pagination = [
    body('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),
    body('size')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Size must be between 1 and 100')
];

exports.validateId = (field = 'id') => [
    param(field)
        .isString()
        .trim()
        .notEmpty()
        .withMessage(`Invalid ${field}`)
];

exports.jsonValidator = (field) => [
    body(field)
        .custom((value) => {
            try {
                if (typeof value === 'string') {
                    JSON.parse(value);
                }
                return true;
            } catch (e) {
                throw new Error(`${field} must be valid JSON`);
            }
        })
];