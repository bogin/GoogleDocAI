const express = require('express');
const {
    pagination,
    validateId
} = require('../validators/common.validator');
const {
    validateUpdateBody,
    validateFileFilters
} = require('../validators/files.validator');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { createRateLimiter } = require('../middlewares/rateLimiter.middleware');
const {
    addSecurityHeaders,
    configureCors,
    configureCSP
} = require('../middlewares/security.middleware');
const filesController = require('../controllers/files.controller');

const router = express.Router();

const filesLimiterMiddleware = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many file operations'
});

router.use([
    filesLimiterMiddleware,
    addSecurityHeaders({ strict: true }),
    configureCors({
        methods: 'GET,POST,PUT,DELETE',
        maxAge: '3600'
    }),
    configureCSP({
        connectSrc: ["'self'"],
        downloadSrc: ["'self'"],
        scriptSrc: ["'self'"]
    })
]);

router.post('/',
    [
        ...pagination,
        validateFileFilters,
        handleValidationErrors
    ],
    filesController.listFiles
);

router.get('/:fileId',
    [
        validateId('fileId'),
        handleValidationErrors
    ],
    filesController.getFile
);

router.delete('/:fileId',
    [
        validateId('fileId'),
        handleValidationErrors
    ],
    filesController.deleteFile
);

router.put('/:fileId',
    [
        validateId('fileId'),
        validateUpdateBody,
        handleValidationErrors
    ],
    filesController.updateFile
);

module.exports = router;