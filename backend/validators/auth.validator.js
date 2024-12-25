const { query } = require('express-validator');

exports.validateAuthCode = [
    query('code')
        .trim()
        .notEmpty()
        .withMessage('Authorization code is required')
        .isString()
        .withMessage('Invalid authorization code format'),

    query('state')
        .optional()
        .isString()
        .withMessage('Invalid state parameter'),

    query('error')
        .optional()
        .isString()
        .withMessage('Invalid error parameter')
];