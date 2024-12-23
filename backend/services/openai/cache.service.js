const NodeCache = require('node-cache');
const { redisClient, redisConfig } = require('../../config/redis.config');

/**
 * A multi-level caching service that combines in-memory and Redis caching strategies.
 * 
 * This service provides a two-tier caching mechanism:
 * 1. In-memory cache (NodeCache): 
 *    - Offers extremely fast access to recently used data
 *    - Reduces load on Redis for frequently accessed items
 *    - Provides local, rapid retrieval within a single server instance
 * 
 * 2. Distributed Redis Cache:
 *    - Serves as a persistent, sharable cache across multiple server instances
 *    - Provides data durability and cross-service cache sharing
 *    - Acts as a backup and shared storage mechanism
 * 
 * Caching Strategy:
 * - First checks the in-memory cache for data
 * - If not found, queries the Redis cache
 * - When data is retrieved from Redis, it's also stored in the in-memory cache
 * - Supports configurable Time-To-Live (TTL) for cached items
 * 
 * @class
 */
class CacheService {
    constructor() {
        this.memoryCache = new NodeCache({
            stdTTL: redisConfig.defaultTTL,
            checkperiod: 120
        });
    }

    async get(key) {
        try {
            const memoryResult = this.memoryCache.get(key);
            if (memoryResult) {
                return memoryResult;
            }

            const redisResult = await redisClient.get(redisConfig.keyPrefix + key);
            if (redisResult) {
                const parsed = JSON.parse(redisResult);
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