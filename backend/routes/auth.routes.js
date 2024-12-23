const express = require('express');
const { createRateLimiter } = require('../middlewares/rateLimiter.middleware');
const {
    addSecurityHeaders,
    configureCors,
    configureCSP
} = require('../middlewares/security.middleware');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const { validateAuthCode } = require('../validators/auth.validator');
const authController = require('../controllers/auth.controller');

const router = express.Router();

const authLimiterMiddleware = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: 'Too many authentication attempts',
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false
});

const allowedOrigins = process.env.ALLOWED_AUTH_ORIGINS?.split(',') || ['http://localhost:3000'];

router.use([
    authLimiterMiddleware,
    addSecurityHeaders({ strict: true }),
    configureCors({
        origin: allowedOrigins,
        methods: 'GET',
        credentials: true,
        maxAge: '3600',
        allowedHeaders: ['Authorization', 'Content-Type']
    }),
    configureCSP({
        defaultSrc: ["'self'"],
        scriptSrc: [
            "'self'",
            "https://accounts.google.com",
            "https://apis.google.com"
        ],
        frameSrc: [
            "'self'",
            "https://accounts.google.com"
        ],
        imgSrc: [
            "'self'",
            "https://accounts.google.com",
            "https://*.googleusercontent.com"
        ],
        connectSrc: [
            "'self'",
            "https://accounts.google.com",
            "https://oauth2.googleapis.com"
        ]
    })
]);

router.get('/',
    authController.initiateGoogleAuth
);

router.get('/callback',
    validateAuthCode,
    handleValidationErrors,
    authController.handleGoogleCallback
);

router.get('/health',
    (req, res) => res.status(200).json({ status: 'healthy' })
);

module.exports = router;