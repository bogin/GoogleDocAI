const EventEmitter = require('events');

class BaseService extends EventEmitter {
    constructor() {
        super();
        this.isInitialized = false;
        this.initPromise = null;
        this.initResolver = null;
        this.dependencies = [];
    }

    addDependency(service) {
        this.dependencies.push(service);
    }

    async waitForInit() {
        if (this.isInitialized) return true;

        if (!this.initPromise) {
            this.initPromise = new Promise(resolve => {
                this.initResolver = resolve;
            });
        }

        return this.initPromise;
    }

    async waitForDependencies() {
        await Promise.all(this.dependencies?.map(dep => dep.waitForInit()));
    }

    markInitialized() {
        this.isInitialized = true;
        if (this.initResolver) {
            this.initResolver(true);
        }
        this.emit('initialized');
    }
}

module.exports = BaseService
