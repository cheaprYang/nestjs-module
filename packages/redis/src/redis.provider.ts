import { Provider } from '@nestjs/common';
import Redis from 'ioredis';
import Redlock from 'redlock';
import {
  REDIS_CLIENT,
  REDIS_CLIENT_LOCK,
  REDIS_MODULE_OPTIONS,
} from './redis.constants';
import { RedisModuleOptions } from './redis.interface';
export const createClient = (): Provider => ({
  provide: REDIS_CLIENT,
  useFactory: async ({
    isGlobal,
    cluster,
    clusterOptions = {},
    ...other
  }: RedisModuleOptions): Promise<Redis.Redis | Redis.Cluster> => {
    let client: Redis.Redis | Redis.Cluster;
    if (cluster && Array.isArray(cluster)) {
      client = new Redis.Cluster(cluster, clusterOptions);
    } else {
      client = new Redis(other);
    }

    return client;
  },
  inject: [REDIS_MODULE_OPTIONS],
});
export const createRedisLock = (): Provider => ({
  provide: REDIS_CLIENT_LOCK,
  useFactory: async (client: Redis.Redis | Redis.Cluster): Promise<Redlock> => {
    const lock = new Redlock([client], {
      retryCount: 3,
      retryDelay: 100,
      retryJitter: 100,
    });
    return lock;
  },
  inject: [REDIS_CLIENT],
});
