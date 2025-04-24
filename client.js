import env from 'dotenv';
import { createClient } from 'redis';
env.config()

const redisClient = new createClient({ url: process.env.REDIS_URL, });

let isConnected = false;

redisClient.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

export const getRedisClient = async () => {
    if (!isConnected) {
        await redisClient.connect(); // connect once
        isConnected = true;
        console.log('✅ Redis connected');
    }
    return redisClient;
};