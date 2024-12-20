const NodeCache = require('node-cache');
const { redisClient, redisConfig } = require('../config/redis.config');

class CacheService {
    constructor() {
        // In-memory cache for fast access
        this.memoryCache = new NodeCache({ 
            stdTTL: redisConfig.defaultTTL,
            checkperiod: 120
        });
    }

    async get(key) {
        try {
            // Try memory cache first
            const memoryResult = this.memoryCache.get(key);
            if (memoryResult) {
                return memoryResult;
            }

            // Try Redis if not in memory
            const redisResult = await redisClient.get(redisConfig.keyPrefix + key);
            if (redisResult) {
                const parsed = JSON.parse(redisResult);
                // Store in memory cache for faster subsequent access
                this.memoryCache.set(key, parsed);
                return parsed;
            }

            return null;
        } catch (error) {
            console.error('Cache get error:', error);
            return null;
        }
    }

    async set(key, value, ttl = redisConfig.defaultTTL) {
        try {
            // Store in both caches
            this.memoryCache.set(key, value, ttl);
            await redisClient.set(
                redisConfig.keyPrefix + key,
                JSON.stringify(value),
                'EX',
                ttl
            );
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    async delete(key) {
        try {
            this.memoryCache.del(key);
            await redisClient.del(redisConfig.keyPrefix + key);
            return true;
        } catch (error) {
            console.error('Cache delete error:', error);
            return false;
        }
    }

    async clear() {
        try {
            this.memoryCache.flushAll();
            await redisClient.flushall();
            return true;
        } catch (error) {
            console.error('Cache clear error:', error);
            return false;
        }
    }
}

module.exports = new CacheService();