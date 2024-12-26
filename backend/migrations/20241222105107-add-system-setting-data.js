module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('system_settings', [
      {
        key: 'openai',
        value: JSON.stringify({
          typoKey: "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",
          analyticsKey: "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",
          mongoFilesKey: "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",
          postgresFilesKey: "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"
        }),
        updated_at: new Date()
      },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('system_settings');
  }
};