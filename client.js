import Redis from "ioredis";


let redisClient;
// Replace with your real credentials
if (process.env.NODE_ENV === 'localhost') {
    redisClient = new Redis('redis://default:YxGlJvCArTuEcWwRYiAPTNepdXuRgwJz@tramway.proxy.rlwy.net:14852');
  } else {
    redisClient = new Redis('redis://default:YxGlJvCArTuEcWwRYiAPTNepdXuRgwJz@redis.railway.internal:6379');
  }

redisClient.on('connect', () => {
    console.log('✅ Connected to Redis on Railway');
});

redisClient.on('error', (err) => {
    console.error('❌ Redis connection error:', err);
});

export default redisClient