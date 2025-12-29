import Redis from 'ioredis';

if (!process.env.REDIS_URL) {
  throw new Error('REDIS_URL is not defined in environment variables');
}

// Create Redis client
export const redis = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
});

export const PASTE_PREFIX = 'paste:';

export function getPasteKey(id: string): string {
  return `${PASTE_PREFIX}${id}`;
}

// Helper functions to match KV interface
export const kv = {
  async get<T = string>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value as T;
  },

  async set(key: string, value: string, options?: { ex?: number }): Promise<void> {
    if (options?.ex) {
      await redis.setex(key, options.ex, value);
    } else {
      await redis.set(key, value);
    }
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async ping(): Promise<string> {
    return await redis.ping();
  },
};