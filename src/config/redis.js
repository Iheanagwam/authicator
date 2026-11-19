import Redis from 'ioredis';

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  lazyConnect: false,
  retryStrategy(times) {
    if (times > 10) {
      console.error('[Redis] Too many retries. Stopping.');
      return null; // stop retrying
    }
    return Math.min(times * 200, 2000);
  },
});

redisClient.on('connect', () => {
  console.log('[Redis] Connected successfully');
});

redisClient.on('error', (err) => {
  console.error('[Redis] Error:', err.message);
});

redisClient.on('reconnecting', () => {
  console.log('[Redis] Reconnecting...');
});

export default redisClient;