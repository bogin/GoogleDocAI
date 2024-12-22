const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class SystemSetting extends Model {
    static associate(models) {
      // Define associations here if needed
    }

    // Instance methods
    toJSON() {
      const values = { ...this.get() };
      return values;
    }
  }

  SystemSetting.init({
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 255]
      }
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: false,
      validate: {
        notNull: true,
        notEmpty: true
      }
    }
  }, {
    sequelize,
    modelName: 'SystemSetting',
    tableName: 'system_settings',
    timestamps: true,
    updatedAt: 'updated_at',
    createdAt: false,
    
    hooks: {
      beforeSave: async (setting) => {
        // Convert string values to JSON if needed
        if (typeof setting.value === 'string') {
          try {
            setting.value = JSON.parse(setting.value);
          } catch (e) {
            throw new Error('Invalid JSON in value field');
          }
        }
      }
    }
  });

  return SystemSetting;
};