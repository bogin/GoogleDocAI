const express = require('express');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// Auth-specific rate limiter
const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 requests per hour
    message: 'Too many authentication attempts, please try again later'
});

router.use(authLimiter);

// Add security headers middleware
router.use((req, res, next) => {
    res.set({
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block'
    });
    next();
});

router.get('/', authController.initiateGoogleAuth);
router.get('/callback', authController.handleGoogleCallback);

module.exports = router;