const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const analyticsController = require('../controllers/analytics.controller');
const rateLimit = require('express-rate-limit');

// Analytics-specific rate limiter
const analyticsLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // Limit each IP to 50 requests per windowMs
    message: 'Too many analytics requests, please try again later'
});

// Validation middleware
const validateAnalyticsRequest = [
    body('query').isString().trim().notEmpty().escape()
];

router.post(
    '/analyze',
    analyticsLimiter,
    validateAnalyticsRequest,
    analyticsController.analyzeFiles.bind(analyticsController)
);

module.exports = router;