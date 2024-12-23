const { body } = require('express-validator');

exports.validateFileFilters = body('filters')
    .optional()
    .custom((value) => {
        if (value) {
            try {
                if (typeof value === 'string') {
                    JSON.parse(value);
                }
                return true;
            } catch (e) {
                throw new Error('Invalid filters format');
            }
        }
        return true;
    });

exports.validateUpdateBody = [
    body('name')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('File name must be between 1 and 255 characters'),

    body('shared')
        .optional()
        .isBoolean()
        .withMessage('Shared must be a boolean value'),

    body('metadata')
        .optional()
        .custom((value) => {
            try {
                if (typeof value === 'string') {
                    JSON.parse(value);
                }
                return true;
            } catch (e) {
                throw new Error('Invalid metadata format');
            }
        })
];