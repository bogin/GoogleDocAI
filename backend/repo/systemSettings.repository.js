const { SystemSetting } = require('../models');

class SystemSettingsRepository {
    async findAll() {
        return SystemSetting.findAll();
    }

    async findByKey(key) {
        return SystemSetting.findByPk(key);
    }

    async upsert({key, value}) {
        const [setting] = await SystemSetting.upsert({
            key,
            value
        });
        return setting;
    }

    async create(key, value) {
        return SystemSetting.create({
            key,
            value
        });
    }

    async updateBatch(settings, transaction) {
        return Promise.all(
            settings.map(({ key, value }) =>
                SystemSetting.upsert(
                    { key, value },
                    { transaction }
                )
            )
        );
    }

    async findOne({ queryConfig }) {
        try {
            const res = await SystemSetting.findOne(queryConfig);
            return res;
        } catch (error) {
            throw new Error(`Failed to find file: ${error.message}, ${queryConfig}`);
        }
    }
}

module.exports = new SystemSettingsRepository();