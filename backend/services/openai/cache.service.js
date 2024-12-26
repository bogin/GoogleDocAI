const NodeCache = require('node-cache');

class CacheService {
    constructor() {
        this.memoryCache = new NodeCache({
            stdTTL: 3600,
            checkperiod: 120
        });
    }

    async get(key) {
        try {
            const memoryResult = this.memoryCache.get(key);
            if (memoryResult) {
                return memoryResult;
            }

            return null;
        } catch (error) {
            console.error('Cache get error:');
            return null;
        }
    }

    async set(key, value, ttl = 3600) {
        try {
            this.memoryCache.set(key, value, ttl);
            return true;
        } catch (error) {
            console.error('Cache set error:');
            return false;
        }
    }

    async delete(key) {
        try {
            this.memoryCache.del(key);
            return true;
        } catch (error) {
            console.error('Cache delete error:');
            return false;
        }
    }

    async clear() {
        try {
            this.memoryCache.flushAll();
            return true;
        } catch (error) {
            console.error('Cache clear error:');
            return false;
        }
    }
}

module.exports = new CacheService();