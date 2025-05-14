import env from 'dotenv';
env.config()

// client.js
import { createClient } from 'redis';

const redis = createClient({
  url: process.env.REDIS_URL, // should be redis://default:pass@redis.railway.internal:6379
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err);
});

export const getRedisClient = async () => {
  if (!redis.isOpen) {
    await redis.connect();
    console.log('✅ Redis connected');
  }
  return redis;
};
