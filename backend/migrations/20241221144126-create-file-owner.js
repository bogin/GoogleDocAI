'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('file_owners', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      file_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: 'files',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      permission_role: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'reader'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('file_owners', ['file_id', 'user_id'], {
      unique: true,
      name: 'file_owner_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('file_owners');
  }
};