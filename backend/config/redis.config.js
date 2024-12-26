const Redis = require('ioredis');

const redisConfig = {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD,
    keyPrefix: 'openai:query:',
    defaultTTL: 3600
};

const redisClient = new Redis(redisConfig);

module.exports = {
    redisClient,
    redisConfig
};