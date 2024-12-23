const express = require('express');
const { createRateLimiter } = require('../middlewares/rateLimiter.middleware');
const { handleValidationErrors } = require('../middlewares/validator.middleware');
const {
  addSecurityHeaders,
  configureCors
} = require('../middlewares/security.middleware');
const {
  validateSettingKey,
  validateSettingValue,
  validateBatchSettings
} = require('../validators/systemSettings.validator');
const systemSettingsController = require('../controllers/system-settings.controller');

const router = express.Router();

const settingsLimiterMiddleware = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many settings operations'
});

router.use([
  settingsLimiterMiddleware,
  addSecurityHeaders({ strict: true }),
  configureCors({
    methods: 'GET,PUT,POST',
    maxAge: '3600'
  })
]);

router.get('/', systemSettingsController.getAll);
router.get('/:key',
  validateSettingKey,
  handleValidationErrors,
  systemSettingsController.get
);

router.post('/',
  [...validateSettingKey, ...validateSettingValue],
  handleValidationErrors,
  systemSettingsController.create
);

router.put('/:key',
  [...validateSettingKey, ...validateSettingValue],
  handleValidationErrors,
  systemSettingsController.update
);

router.put('/',
  validateBatchSettings,
  handleValidationErrors,
  systemSettingsController.updateBatch
);

module.exports = router;