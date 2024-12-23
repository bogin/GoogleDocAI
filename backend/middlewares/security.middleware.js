const helmet = require('helmet');
const xss = require('xss-clean');
const { createRateLimiter } = require('./rateLimiter.middleware');

const securityHeaders = {
    strict: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Content-Security-Policy': "default-src 'self'",
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'Permissions-Policy': 'geolocation=(), microphone=()'
    },
    standard: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-XSS-Protection': '1; mode=block'
    }
};

const helmetConfig = {
    crossOriginEmbedderPolicy: true,
    crossOriginOpenerPolicy: true,
    crossOriginResourcePolicy: { policy: "same-site" },
    dnsPrefetchControl: true,
    frameguard: { action: 'deny' },
    hidePoweredBy: true,
    hsts: true,
    ieNoOpen: true,
    noSniff: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xssFilter: true
};

exports.globalSecurityMiddleware = [
    helmet(helmetConfig),
    xss(),
    createRateLimiter({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'Too many requests from this IP, please try again later.'
    })
];

exports.addSecurityHeaders = (options = { strict: false }) => {
    return (req, res, next) => {
        const headers = options.strict ? securityHeaders.strict : securityHeaders.standard;
        res.set(headers);
        next();
    };
};

exports.configureCors = (options = {}) => {
    return (req, res, next) => {
        res.set({
            'Access-Control-Allow-Origin': options.origin || '*',
            'Access-Control-Allow-Methods': options.methods || 'GET,HEAD,PUT,PATCH,POST,DELETE',
            'Access-Control-Allow-Headers': options.headers || 'Content-Type,Authorization',
            'Access-Control-Max-Age': options.maxAge || '86400'
        });
        next();
    };
};

// Content Security Policy middleware
exports.configureCSP = (options = {}) => {
    return helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            ...options
        }
    });
};