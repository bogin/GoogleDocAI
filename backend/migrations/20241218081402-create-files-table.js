module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('files', {
      id: {
        type: Sequelize.STRING,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      mime_type: {
        type: Sequelize.STRING
      },
      icon_link: {
        type: Sequelize.STRING
      },
      web_view_link: {
        type: Sequelize.STRING
      },
      size: {
        type: Sequelize.STRING
      },
      shared: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      trashed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      created_time: {
        type: Sequelize.DATE
      },
      modified_time: {
        type: Sequelize.DATE
      },
      version: {
        type: Sequelize.STRING
      },
      last_modifying_user: {
        type: Sequelize.JSONB
      },
      permissions: {
        type: Sequelize.JSONB
      },
      capabilities: {
        type: Sequelize.JSONB
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
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: null
      }
    });

    // Add useful indexes
    await queryInterface.addIndex('files', ['sync_status']);
    await queryInterface.addIndex('files', ['modified_time']);
    await queryInterface.addIndex('files', ['trashed']);
    await queryInterface.addIndex('files', ['mime_type']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('files');
  }
};