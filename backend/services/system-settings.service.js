const { SystemSetting } = require('../models');

class SystemSettingsService {
    async getAll() {
        try {
            const settings = await SystemSetting.findAll();
            return settings;
        } catch (error) {
            throw new Error('Failed to fetch system settings: ' + error.message);
        }
    }

    async get(key) {
        try {
            const setting = await SystemSetting.findByPk(key);
            return setting;
        } catch (error) {
            throw new Error(`Failed to fetch setting ${key}: ${error.message}`);
        }
    }

    async update(key, value) {
        try {
            const [setting] = await SystemSetting.upsert({
                key,
                value,
            });
            return setting;
        } catch (error) {
            throw new Error(`Failed to update setting ${key}: ${error.message}`);
        }
    }

    async create(key, value) {
        try {
            // Check if setting exists
            const existing = await this.get(key);
            if (existing) {
                throw new Error(`Setting with key ${key} already exists`);
            }

            // Create new setting
            const setting = await SystemSetting.create({
                key,
                value,
            });
            return setting;
        } catch (error) {
            throw new Error(`Failed to create setting ${key}: ${error.message}`);
        }
    }

    async updateBatch(settings) {
        const t = await SystemSetting.sequelize.transaction();
        try {
            const results = await Promise.all(
                settings.map(({ key, value }) =>
                    SystemSetting.upsert(
                        {
                            key,
                            value,
                        },
                        { transaction: t }
                    )
                )
            );
            await t.commit();
            return results.map(([setting]) => setting);
        } catch (error) {
            await t.rollback();
            throw new Error('Failed to update settings: ' + error.message);
        }
    }
}

module.exports = new SystemSettingsService();