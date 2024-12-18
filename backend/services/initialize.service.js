
const GoogleService = require('./google.service');
const ETLService = require('./etl.service');
const validateDatabaseConnection = require('./db.service');

async function initializeServices(auth = null) {
    try {
        // 1. Validate database connection
        const isDbConnected = await validateDatabaseConnection();
        if (!isDbConnected) {
            console.error('Database connection failed');
            process.exit(1);
        }
        console.log('Database connected successfully');

        // 2. Initialize Google Auth
        auth = auth || await GoogleService.initializeGoogleAuth();
        if (!auth) {
            console.error('Google authentication failed');
            return false;
        } else {
            console.log('Google Auth initialized successfully');

            // 3. Initialize ETL Service
            // const etlService = new ETLService(auth);
            // await etlService.startPeriodicSync();
            // console.log('ETL Service started successfully');

            return true;
        }

    } catch (error) {
        console.error('Services initialization failed:', error);
        return false;
    }
}

module.exports = initializeServices;