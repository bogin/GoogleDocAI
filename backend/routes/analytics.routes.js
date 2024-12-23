const express = require('express');
const { createRateLimiter } = require('../middlewares/rateLimiter.middleware');
const {
    addSecurityHeaders,
    configureCors,
    configureCSP
} = require('../middlewares/security.middleware');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { validateAnalyticsQuery } = require('../validators/analytics.validator');
const analyticsController = require('../controllers/analytics.controller');

const router = express.Router();

const analyticsLimiterMiddleware = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 50,
    message: 'Too many analytics requests',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});

router.use([
    analyticsLimiterMiddleware,
    addSecurityHeaders({ strict: true }),
    configureCors({
        methods: 'POST',
        maxAge: '3600',
        allowedHeaders: ['Content-Type', 'Authorization']
    }),
    configureCSP({
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'"],
        reportUri: '/csp-report'
    }),
]);

router.post('/analyze',
    validateAnalyticsQuery,
    handleValidationErrors,
    analyticsController.analyzeFiles
);

module.exports = router;