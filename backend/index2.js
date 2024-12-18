require('dotenv').config();
const validateDatabaseConnection = require('./services/db.service');
const GoogleService = require('./services/google.service');
const ETLService = require('./services/etl.service');
const syncQueue = require('./services/queue.service');

async function startETLProcess() {
    try {
        // Initialize database
        const isDbConnected = await validateDatabaseConnection();
        if (!isDbConnected) {
            throw new Error('Database connection failed');
        }
        console.log('Database connected successfully');

        // Initialize Google Auth
        const auth = await GoogleService.initializeGoogleAuth();
        if (!auth) {
            console.error('Google authentication failed');
        } else {
            console.log('Google Auth initialized successfully');

            // Initialize ETL Service
            const etlService = new ETLService(auth);
            await etlService.startPeriodicSync();
            console.log('ETL Service started successfully');

            // Start queue monitoring
            syncQueue.startMonitoring();
            console.log('Queue monitoring started');
        }
        // Handle process termination
        process.on('SIGTERM', gracefulShutdown);
        process.on('SIGINT', gracefulShutdown);

    } catch (error) {
        console.error('Failed to start ETL process:', error);
        process.exit(1);
    }
}

function gracefulShutdown() {
    console.log('ETL process: Shutdown signal received');
    syncQueue.stopMonitoring();
    // Add any other cleanup needed
    process.exit(0);
}

// Start the ETL process
startETLProcess().catch(error => {
    console.error('Fatal error during ETL startup:', error);
    process.exit(1);
});