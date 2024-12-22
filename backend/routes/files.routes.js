const express = require('express');
const { body, param } = require('express-validator');
const filesController = require('../controllers/files.controller');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Files-specific rate limiter
const filesLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many file operations, please try again later'
});

// Validation middleware
const validateFileOperation = [
    body('page').optional().isInt({ min: 1 }),
    body('size').optional().isInt({ min: 1, max: 100 }),
    body('filters').optional().isString(),
];

const validateFileId = [
    param('fileId').isString().trim().notEmpty()
];

router.use(filesLimiter);

router.post('/', validateFileOperation, filesController.listFiles);
router.get('/:fileId', validateFileId, filesController.getFile);
router.delete('/:fileId', validateFileId, filesController.deleteFile);
router.put('/:fileId', [...validateFileId, body().notEmpty()], filesController.updateFile);

module.exports = router;