
import env from 'dotenv';
import { createClient } from 'redis';
env.config()

const redisClient = new createClient({ url: process.env.REDIS_URL, });

redisClient.on('connect', () => {
    console.log('✅ Connected to Redis on Railway');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

export default redisClient