'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      permission_id: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        unique: true,
        allowNull: false
      },
      display_name: {
        type: Sequelize.STRING,
        allowNull: true
      },
      photo_link: {
        type: Sequelize.STRING,
        allowNull: true
      },
      total_files: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_size: {
        type: Sequelize.BIGINT,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['permission_id']);

  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  }
};