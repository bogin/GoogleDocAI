const { body, param } = require('express-validator');

exports.validateSettingKey = [
    param('key')
        .trim()
        .notEmpty()
        .withMessage('Key is required')
        .isLength({ max: 255 })
        .withMessage('Key must be less than 255 characters')
        .escape()
];

exports.validateSettingValue = [
    body()
        .notEmpty()
        .withMessage('Value is required')
        .custom((value) => {
            try {
                if (typeof value === 'string') {
                    JSON.parse(value);
                }
                return true;
            } catch (e) {
                throw new Error('Value must be valid JSON');
            }
        })
];

exports.validateBatchSettings = [
    body('settings')
        .isArray()
        .withMessage('Settings must be an array')
        .notEmpty()
        .withMessage('Settings cannot be empty'),
    body('settings.*.key')
        .trim()
        .notEmpty()
        .withMessage('Key is required for all settings')
        .escape(),
    body('settings.*.value')
        .notEmpty()
        .withMessage('Value is required for all settings')
        .custom((value) => {
            try {
                if (typeof value === 'string') {
                    JSON.parse(value);
                }
                return true;
            } catch (e) {
                throw new Error('Value must be valid JSON');
            }
        })
];