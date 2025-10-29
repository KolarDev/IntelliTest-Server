import { RedisOptions } from 'ioredis';

export const redisConnection: RedisOptions = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  db: 1,
//   password: process.env.REDIS_PASSWORD, // Optional
  maxRetriesPerRequest: null, // Essential for robust job queues
};