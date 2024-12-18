module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('files', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING
      },
      modified_time: {
        type: Sequelize.DATE
      },
      owner: {
        type: Sequelize.STRING
      },
      size: {
        type: Sequelize.BIGINT
      },
      metadata: {
        type: Sequelize.JSONB
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      sync_status: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
      },
      last_sync_attempt: {
        type: Sequelize.DATE
      },
      error_log: {
        type: Sequelize.JSONB
      }
    });

    await queryInterface.addIndex('files', ['modified_time']);
    await queryInterface.addIndex('files', ['owner']);
    await queryInterface.addIndex('files', ['sync_status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('files');
  }
};