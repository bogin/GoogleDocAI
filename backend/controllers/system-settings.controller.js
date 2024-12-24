const systemSettingsService = require('../services/system-settings.service');

class SystemSettingsController {
  async getAll(req, res) {
    try {
      const settings = await systemSettingsService.getAll();
      res.json(settings);
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
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch setting' });
    }
  }

  async update(req, res) {
    try {
      const setting = await systemSettingsService.update(
        req.params.key,
        req.body
      );
      res.json(setting);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update setting' });
    }
  }

  async create(req, res) {
    try {
      const existing = await systemSettingsService.get(req.body.key);
      if (existing) {
        return res.status(409).json({
          error: 'Setting already exists'
        });
      }

      const setting = await systemSettingsService.create(
        req.body.key,
        req.body.value
      );
      res.status(201).json(setting);
    } catch (error) {
      res.status(500).json({ error: 'Failed to create setting' });
    }
  }

  async updateBatch(req, res) {
    try {
      const settings = await systemSettingsService.updateBatch(req.body.settings);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update settings' });
    }
  }
}

module.exports = new SystemSettingsController();