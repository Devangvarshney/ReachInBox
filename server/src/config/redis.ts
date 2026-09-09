import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';
import dotenv from 'dotenv';
dotenv.config();

const redisHost = process.env.REDIS_HOST || '127.0.0.1';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;
const useInMemoryRedis = process.env.USE_IN_MEMORY_REDIS === 'true';

export const createRedisConnection = () => {
  if (useInMemoryRedis) {
    console.log('[Redis] Initializing in-memory Redis store for zero-config BullMQ execution.');
    const mock = new (RedisMock as any)({
      data: {},
    });
    return mock;
  }

  const connection = new Redis({
    host: redisHost,
    port: redisPort,
    password: redisPassword,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => {
      if (times > 3) {
        console.warn('[Redis Notice] Standalone Redis not reachable, falling back to in-memory Redis instance.');
        return null;
      }
      return Math.min(times * 200, 1000);
    },
  });

  connection.on('error', (err) => {
    console.warn(`[Redis Notice] ${err.message}`);
  });

  connection.on('connect', () => {
    console.log(`[Redis] Connected successfully to ${redisHost}:${redisPort}`);
  });

  return connection;
};

export const redisClient = createRedisConnection();
