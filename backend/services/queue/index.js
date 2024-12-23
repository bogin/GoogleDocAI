const { Op } = require('sequelize');
const BaseService = require('../base.service');
const googleService = require('../google.service');
const filesRepository = require('../../repo/files.repository');

class SyncQueue extends BaseService {
    constructor() {
        super();
        this.addDependency(googleService);
        this.queue = [];
        this.isProcessing = false;
        this.taskProcessor = null;
    }

    async initialize() {
        await this.waitForDependencies();
        this.startMonitoring();
        this.markInitialized();
    }

    async addToQueue(task) {
        await this.waitForInit();
        this.queue.push(task);
        if (!this.isProcessing) {
            await this.processQueue();
        }
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
            const modifiedFiles = await filesRepository.findAll({
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
            await this.processor.processFiles(task);
        }
    }

    setProcessor(processor) {
        this.processor = processor;
    }
}

const syncQueue = new SyncQueue();
module.exports = syncQueue