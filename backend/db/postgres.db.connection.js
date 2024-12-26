const { sequelize } = require('../models');

async function validateDatabaseConnection() {
    try {
        await sequelize.authenticate();
        return true;
    } catch (error) {
        console.error('Unable to connect to the database:');
        return false;
    }
}

module.exports = validateDatabaseConnection;