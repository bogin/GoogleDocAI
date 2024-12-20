const { File } = require('../models');
const { Op } = require('sequelize');

class SyncQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
        this.lastCheckTime = null;
        this.monitorInterval = null;
        this.isInitialized = false;
        this.processor = null;
    }

    setInitialized(value) {
        this.isInitialized = value;
        if (value && !this.monitorInterval) {
            this.startMonitoring();
        }
    }

    startMonitoring() {
        this.monitorInterval = setInterval(() => {
            if (this.isInitialized) {
                this.checkForChanges();
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
        if (this.processor) {
            await this.processor(task);
        }
    }

    setProcessor(processor) {
        this.processor = processor;
    }
}
const syncQueue = new SyncQueue();
module.exports = syncQueue