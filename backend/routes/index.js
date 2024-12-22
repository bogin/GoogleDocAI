const express = require('express');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const xss = require('xss-clean');
const authRoutes = require('./auth.routes');
const filesRoutes = require('./files.routes');
const analyticsRoutes = require('./analytics.routes');

const router = express.Router();

// Apply security middlewares
router.use(helmet());
router.use(xss());

// Global rate limiter
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.'
});
router.use(limiter);

router.use('/auth', authRoutes);
router.use('/files', filesRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;