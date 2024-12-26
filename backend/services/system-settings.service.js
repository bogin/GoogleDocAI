const systemSettingsRepository = require('../repo/systemSettings.repository');

class SystemSettingsService {
    async getAll() {
        try {
            return await systemSettingsRepository.findAll();
        } catch (error) {
            throw new Error('Failed to fetch system settings: ' + error.message);
        }
    }

    async get(key) {
        try {
            return await systemSettingsRepository.findByKey(key);
        } catch (error) {
            throw new Error(`Failed to fetch setting ${key}: ${error.message}`);
        }
    }

    async update(key, value) {
        try {
            return await systemSettingsRepository.upsert({ key, value });
        } catch (error) {
            throw new Error(`Failed to update setting ${key}: ${error.message}`);
        }
    }

    async create(key, value) {
        try {
            const existing = await this.get(key);
            if (existing) {
                throw new Error(`Setting with key ${key} already exists`);
            }
            return await systemSettingsRepository.create(key, value);
        } catch (error) {
            throw new Error(`Failed to create setting ${key}: ${error.message}`);
        }
    }

    async updateBatch(settings) {
        const transaction = await systemSettingsRepository.SystemSetting.sequelize.transaction();
        try {
            const results = await systemSettingsRepository.updateBatch(settings, transaction);
            await transaction.commit();
            return results.map(([setting]) => setting);
        } catch (error) {
            await transaction.rollback();
            throw new Error('Failed to update settings: ' + error.message);
        }
    }
}

module.exports = new SystemSettingsService();