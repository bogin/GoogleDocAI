const { query } = require('express-validator');

exports.validateAuthCode = [
    query('code')
        .trim()
        .notEmpty()
        .withMessage('Authorization code is required')
        .isString()
        .withMessage('Invalid authorization code format')
        .matches(/^[A-Za-z0-9_-]+$/)
        .withMessage('Authorization code contains invalid characters'),

    query('state')
        .optional()
        .isString()
        .withMessage('Invalid state parameter')
        .matches(/^[A-Za-z0-9_-]+$/)
        .withMessage('State parameter contains invalid characters'),

    query('error')
        .optional()
        .isString()
        .withMessage('Invalid error parameter')
];