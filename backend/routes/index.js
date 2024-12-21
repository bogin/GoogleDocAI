const express = require('express');
const authRoutes = require('./auth.routes');
const filesRoutes = require('./files.routes');
const analyticsRoutes = require('./analytics.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/files', filesRoutes);
router.use('/analytics', analyticsRoutes);

module.exports = router;