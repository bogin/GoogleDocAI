require('dotenv').config();
const validateDatabaseConnection = require('./services/db.service');
const googleService = require('./services/google.service');
const etlService = require('./services/etl.service');
const syncQueue = require('./services/queue.service');

async function startETLProcess() {
    try {
        // Initialize database
        const isDbConnected = await validateDatabaseConnection();
        if (!isDbConnected) {
            throw new Error('Database connection failed');
        }
        console.log('Database connected successfully');

        // Start initialization of services
        const initPromise = etlService.initialize();

        // Initialize Google Auth
        const auth = await googleService.initializeGoogleAuth();
        if (auth) {
            console.log('Google Auth initialized successfully');
            etlService.setAuth(auth);
            syncQueue.setInitialized(true);
            console.log('Services fully initialized with auth');
        } else {
            console.log('Waiting for authentication...');

            // Listen for authentication events
            googleService.on('authenticated', (auth) => {
                console.log('Received authentication update');
                etlService.setAuth(auth);
                syncQueue.setInitialized(true);
                console.log('Services fully initialized with auth');
            });
        }

        // Wait for initialization to complete
        await initPromise;
        console.log('ETL Service initialization complete');

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
    if (etlService.authCheckInterval) {
        clearInterval(etlService.authCheckInterval);
    }
    syncQueue.stopMonitoring();
    process.exit(0);
}

// Start the ETL process
startETLProcess().catch(error => {
    console.error('Fatal error during ETL startup:', error);
    process.exit(1);
});