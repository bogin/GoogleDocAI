const express = require('express');
const rateLimit = require('express-rate-limit');
const systemSettingsController = require('../controllers/system-settings.controller');

const router = express.Router();

// Rate limiter for settings routes
const settingsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiter to all routes in this router
router.use(settingsLimiter);

// Routes
router.get('/', systemSettingsController.getAll);
router.get('/:key', systemSettingsController.get);
router.put('/:key', systemSettingsController.update);
router.put('/', systemSettingsController.updateBatch);

module.exports = router;