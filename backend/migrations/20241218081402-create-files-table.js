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
        type: Sequelize.BOOLEAN
      },
      trashed: {
        type: Sequelize.BOOLEAN
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
      owner: {
        type: Sequelize.JSONB // Store full owner object
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
        type: Sequelize.JSONB // Store complete raw response
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('files');
  }
};