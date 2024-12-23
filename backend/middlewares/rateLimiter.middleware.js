const rateLimit = require('express-rate-limit');

exports.createRateLimiter = ({ windowMs, max, message }) => {
    return rateLimit({
        windowMs: windowMs || 15 * 60 * 1000,
        max: max || 100,
        message: message || 'Too many requests, please try again later',
        standardHeaders: true,
        legacyHeaders: false,
    });
};