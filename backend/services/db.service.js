const { sequelize } = require('../models');

async function validateDatabaseConnection() {
    try {
        await sequelize.authenticate();
        console.log('Database connection has been established successfully.');
        return true;
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        return false;
    }
}

module.exports = validateDatabaseConnection;