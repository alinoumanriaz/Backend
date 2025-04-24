import Redis from "ioredis";

const redisClient = new Redis(process.env.REDIS_URL)

redisClient.on('connect', () => {
    console.log('✅ Connected to Redis on Railway');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

export default redisClient