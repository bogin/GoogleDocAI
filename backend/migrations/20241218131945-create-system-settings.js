module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('system_settings', {
      key: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 255]
        }
      },
      value: {
        type: Sequelize.JSONB,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes for better performance
    await queryInterface.addIndex('system_settings', ['key']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('system_settings');
  }
};