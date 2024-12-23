const express = require('express');
const { globalSecurityMiddleware } = require('../middlewares/security.middleware');
const authRoutes = require('./auth.routes');
const filesRoutes = require('./files.routes');
const analyticsRoutes = require('./analytics.routes');
const systemSettingsRoutes = require('./system-settings.routes');

const router = express.Router();

router.use(globalSecurityMiddleware);

router.use('/auth/google', authRoutes);
router.use('/files', filesRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/system-settings', systemSettingsRoutes);

module.exports = router;