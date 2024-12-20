const { File } = require('../models');
const { Op } = require('sequelize');
const EventEmitter = require('events');

class SyncQueue extends EventEmitter {
    constructor() {
        super();
        this.queue = [];
        this.isProcessing = false;
        this.lastCheckTime = null;
        this.monitorInterval = null;
        this.isInitialized = false;
        this.taskProcessor = null;
        this.waitForAuthPromise = null;
        this.authResolver = null;
    }

    async waitForAuth() {
        if (this.isInitialized) return true;
        
        if (!this.waitForAuthPromise) {
            this.waitForAuthPromise = new Promise(resolve => {
                this.authResolver = resolve;
            });
        }
        
        return this.waitForAuthPromise;
    }

    setInitialized(value) {
        this.isInitialized = value;
        if (value) {
            if (this.authResolver) {
                this.authResolver(true);
            }
            if (!this.monitorInterval) {
                this.startMonitoring();
            }
        }
    }

    startMonitoring() {
        this.monitorInterval = setInterval(async () => {
            if (this.isInitialized) {
                await this.checkForChanges();
            }
        }, 60 * 1000);
    }

    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
    }

    async checkForChanges() {
        if (!this.isInitialized) {
            await this.waitForAuth();
        }

        try {
            const modifiedFiles = await File.findAll({
                where: {
                    [Op.or]: [
                        {
                            modifiedTime: {
                                [Op.gt]: this.lastCheckTime || new Date()
                            }
                        },
                        {
                            syncStatus: {
                                [Op.in]: ['pending', 'error']
                            }
                        }
                    ]
                }
            });

            if (modifiedFiles.length > 0) {
                await this.addToQueue({
                    type: 'UPDATE_CHECK',
                    files: modifiedFiles
                });
            }

            this.lastCheckTime = new Date();
        } catch (error) {
            console.error('Error checking for changes:', error);
        }
    }

    async addToQueue(task) {
        await this.waitForAuth();
        this.queue.push(task);
        if (!this.isProcessing) {
            await this.processQueue();
        }
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        try {
            while (this.queue.length > 0) {
                const task = this.queue.shift();
                if (this.taskProcessor) {
                    await this.taskProcessor(task);
                }
            }
        } catch (error) {
            console.error('Error processing queue:', error);
        } finally {
            this.isProcessing = false;
        }
    }

    setProcessor(processor) {
        this.taskProcessor = processor;
    }
}

module.exports = new SyncQueue();