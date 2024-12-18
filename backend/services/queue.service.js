class SyncQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
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
        // This will be implemented in ETLService
        if (this.taskProcessor) {
            await this.taskProcessor(task);
        }
    }

    setTaskProcessor(processor) {
        this.taskProcessor = processor;
    }
}

module.exports = new SyncQueue();