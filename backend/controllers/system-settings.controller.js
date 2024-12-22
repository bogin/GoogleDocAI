const systemSettingsService = require('../services/system-settings.service');
const { body, param, validationResult } = require('express-validator');
const sanitizeHtml = require('sanitize-html');

// Validation chains
const validateKey = [
  param('key')
    .trim()
    .notEmpty()
    .withMessage('Key is required')
    .isLength({ max: 255 })
    .withMessage('Key must be less than 255 characters')
    .escape(),
];

const validateValue = [
  body('value')
    .notEmpty()
    .withMessage('Value is required')
    .custom((value) => {
      try {
        // If it's a string, try to parse it
        if (typeof value === 'string') {
          JSON.parse(value);
        }
        // If it's already an object, it's valid
        return true;
      } catch (e) {
        throw new Error('Value must be valid JSON');
      }
    }),
];

const validateBatchUpdate = [
  body('settings')
    .isArray()
    .withMessage('Settings must be an array')
    .notEmpty()
    .withMessage('Settings cannot be empty'),
  body('settings.*.key')
    .trim()
    .notEmpty()
    .withMessage('Key is required for all settings')
    .escape(),
  body('settings.*.value')
    .notEmpty()
    .withMessage('Value is required for all settings'),
];

class SystemSettingsController {
  // Middleware to check validation results
  validateRequest(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }

  // Sanitize the response data
  sanitizeData(data) {
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeItem(item));
    }
    return this.sanitizeItem(data);
  }

  sanitizeItem(item) {
    return {
      key: sanitizeHtml(item.key),
      value: item.value, // Don't sanitize value as it's JSON
      updated_at: item.updated_at
    };
  }

  async getAll(req, res) {
    try {
      const settings = await systemSettingsService.getAll();
      res.json(this.sanitizeData(settings));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  }

  async get(req, res) {
    try {
      const setting = await systemSettingsService.get(req.params.key);
      if (!setting) {
        return res.status(404).json({ error: 'Setting not found' });
      }
      res.json(this.sanitizeData(setting));
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch setting' });
    }
  }

  async update(req, res) {
    try {
      const setting = await systemSettingsService.update(
        req.params.key,
        req.body.value
      );
      res.json(this.sanitizeData(setting));
    } catch (error) {
      res.status(500).json({ error: 'Failed to update setting' });
    }
  }

  async updateBatch(req, res) {
    try {
      const updatedSettings = await systemSettingsService.updateBatch(req.body.settings);
      res.json(this.sanitizeData(updatedSettings));
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
}

// Create controller instance
const controller = new SystemSettingsController();

// Export controller methods with their validation chains
module.exports = {
  getAll: controller.getAll.bind(controller),
  get: [...validateKey, controller.validateRequest, controller.get.bind(controller)],
  update: [...validateKey, ...validateValue, controller.validateRequest, controller.update.bind(controller)],
  updateBatch: [...validateBatchUpdate, controller.validateRequest, controller.updateBatch.bind(controller)]
};