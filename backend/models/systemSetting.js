const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    class SystemSetting extends Model { }

    SystemSetting.init({
        key: {
            type: DataTypes.STRING,
            primaryKey: true
        },
        value: {
            type: DataTypes.JSONB
        }
    }, {
        sequelize,
        modelName: 'SystemSetting',
        tableName: 'system_settings',
        timestamps: true,
        updatedAt: 'updated_at',
        createdAt: false
    });

    return SystemSetting;
};