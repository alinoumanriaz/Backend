import Redis from "ioredis";
import env from 'dotenv';
env.config()

const redisClient = new Redis(process.env.REDIS_URL)

redisClient.on('connect', () => {
    console.log('✅ Connected to Redis on Railway');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

export default redisClient