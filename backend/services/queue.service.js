const { File } = require('../models');
const { Op } = require('sequelize');

class SyncQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.lastCheckTime = null;
        this.monitorInterval = null;
        this.isInitialized = false;
    }

    setInitialized(value) {
        this.isInitialized = value;
        if (value && !this.monitorInterval) {
            this.startMonitoring();
        }
    }

    startMonitoring() {
        // Run monitor every minute
        this.monitorInterval = setInterval(() => {
            if (this.isInitialized) {
                this.checkForChanges();
            }
        }, 60 * 1000); // 1 minute
    }

    stopMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }
    }

    async checkForChanges() {
        try {

            // Find files modified since last check
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
        this.queue.push(task);
        if (!this.isProcessing) {
            await this.processQueue();
        }
    }

    async processQueue() {
        if (this.isProcessing || this.queue.length === 0) return;

        this.isProcessing = true;
        try {
            const task = this.queue.shift();
            await this.processTask(task);
        } catch (error) {
            console.error('Error processing task:', error);
        } finally {
            this.isProcessing = false;
            if (this.queue.length > 0) {
                await this.processQueue();
            }
        }
    }

    async processTask(task) {
        if (this.taskProcessor) {
            await this.taskProcessor(task);
        }
    }

    setTaskProcessor(processor) {
        this.taskProcessor = processor;
    }
}

const queue = new SyncQueue();
module.exports = queue;