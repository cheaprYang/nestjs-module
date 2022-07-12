import { Provider } from '@nestjs/common';
import type {Redis,Cluster} from 'ioredis';
import IoRedis from 'ioredis'
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
  }: RedisModuleOptions): Promise<Redis | Cluster> => {
    let client: Redis | Cluster;
    if (cluster && Array.isArray(cluster)) {
      client = new IoRedis.Cluster(cluster, clusterOptions);
    } else {
      client = new IoRedis(other);
    }

    return client;
  },
  inject: [REDIS_MODULE_OPTIONS],
});
export const createRedisLock = (): Provider => ({
  provide: REDIS_CLIENT_LOCK,
  useFactory: async (client ): Promise<Redlock> => {
    const lock = new Redlock([client], {
      retryCount: 3,
      retryDelay: 100,
      retryJitter: 100,
    });
    return lock;
  },
  inject: [REDIS_CLIENT],
});
