module.exports = {
  up: async (queryInterface, Sequelize) => {
    // await queryInterface.createTable('system_settings', {
    //   key: {
    //     type: Sequelize.STRING,
    //     primaryKey: true,
    //     allowNull: false,
    //     validate: {
    //       notEmpty: true,
    //       len: [1, 255]
    //     }
    //   },
    //   value: {
    //     type: Sequelize.JSONB,
    //     allowNull: false
    //   },
    //   updated_at: {
    //     type: Sequelize.DATE,
    //     allowNull: false,
    //     defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    //   }
    // });

    // // Insert initial settings
    // await queryInterface.bulkInsert('system_settings', [
    //   {
    //     key: 'openai',
    //     value: JSON.stringify({
    //       apiKey: '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'
    //     }),
    //     updated_at: new Date()
    //   },
    //   {
    //     key: 'google',
    //     value: JSON.stringify({
    //       clientId: '939872405402-1me7uv98gtnmge9tsuqleth134c81m30.apps.googleusercontent.com',
    //       clientSecret: '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',
    //       redirectUri: 'http://localhost:3000/auth/google/callback'
    //     }),
    //     updated_at: new Date()
    //   }
    // ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('system_settings');
  }
};