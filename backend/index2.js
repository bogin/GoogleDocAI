// background.js (index2.js)
require('dotenv').config();
const validateDatabaseConnection = require('./services/postgres.db.service');
const googleService = require('./services/google.service');
const etlService = require('./services/etl.service');
const syncQueue = require('./queue/smart.queue');
const fileProcessor = require('./queue/processor');
const EventEmitter = require('events');

class BackgroundService extends EventEmitter {
    constructor() {
        super();
        this.isRunning = false;
        this.processInterval = null;
    }

    async waitForGoogleSettings() {
        return new Promise((resolve) => {
            const checkSettings = async () => {
                const initialized = await googleService.initialize();
                if (initialized) {
                    if (this.configCheckInterval) {
                        clearInterval(this.configCheckInterval);
                    }
                    resolve(true);
                }
            };

            // Check immediately first
            checkSettings();

            // Then set up interval
            this.configCheckInterval = setInterval(checkSettings, 10000); // Check every 10 seconds
        });
    }

    async start() {
        try {
            // Initialize database first
            const isDbConnected = await validateDatabaseConnection();
            if (!isDbConnected) {
                throw new Error('Database connection failed');
            }
            console.log('Database connected successfully');

            // Set up processor for queue
            syncQueue.setProcessor(fileProcessor);

            // Wait for Google service initialization
            console.log('Waiting for Google settings...');
            await this.waitForGoogleSettings();
            console.log('Google service configured from DB');

            // Initialize ETL service in standby mode
            await etlService.initialize();
            console.log('ETL Service initialized in standby mode');

            // Set up auth state listener
            googleService.on('authenticated', async (auth) => {
                console.log('Received authentication update');
                etlService.setAuth(auth);
                syncQueue.setInitialized(true);
                await this.startProcessing();
                console.log('Services activated with auth');
            });

            // Check if we already have valid auth
            const setupNeeded = await googleService.requiresSetup();
            if (!setupNeeded) {
                console.log('Using existing Google authentication');
                etlService.setAuth(googleService.getAuth());
                syncQueue.setInitialized(true);
                await this.startProcessing();
                console.log('Services fully initialized with existing auth');
            }

            // Keep the process alive
            this.startHeartbeat();

            // Set up graceful shutdown
            this.setupShutdownHandlers();

        } catch (error) {
            console.error('Failed to start background service:', error);
            throw error;
        }
    }

    async startProcessing() {
        try {
            await etlService.startPeriodicSync();
            console.log('ETL processing started');
        } catch (error) {
            console.error('Error starting processing:', error);
        }
    }

    startHeartbeat() {
        this.isRunning = true;
        this.processInterval = setInterval(() => {
            if (this.isRunning) {
                console.log('Background service running...', new Date().toISOString());
            }
        }, 60000); // Log every minute
    }

    setupShutdownHandlers() {
        const shutdown = async () => {
            console.log('Shutting down background service...');
            this.isRunning = false;

            if (this.processInterval) {
                clearInterval(this.processInterval);
            }

            if (this.configCheckInterval) {
                clearInterval(this.configCheckInterval);
            }

            try {
                // Stop ETL service
                if (etlService.authCheckInterval) {
                    clearInterval(etlService.authCheckInterval);
                }

                // Stop sync queue
                syncQueue.stopMonitoring();

                console.log('Background service stopped successfully');
                process.exit(0);
            } catch (error) {
                console.error('Error during shutdown:', error);
                process.exit(1);
            }
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);
    }
}

// Create and start the service
const backgroundService = new BackgroundService();
backgroundService.start().catch(error => {
    console.error('Fatal error during background service startup:', error);
    process.exit(1);
});