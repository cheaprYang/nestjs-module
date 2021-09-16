import { ModuleMetadata } from '@nestjs/common';
import { Redis, RedisOptions, ClusterOptions } from 'ioredis';

export interface RedisModuleOptions extends RedisOptions {
  isGlobal?: boolean;
  name?: string;
  url?: string;
  onClientReady?(client: Redis): Promise<void>;
  clusterOptions?: ClusterOptions;
  cluster?: RedisModuleOptions[];
}

export interface RedisModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  isGlobal?: boolean;
  useFactory?: (
    ...args: any[]
  ) =>
    | RedisModuleOptions
    | RedisModuleOptions[]
    | Promise<RedisModuleOptions>
    | Promise<RedisModuleOptions[]>;
  inject?: any[];
}
export interface lockOption {
  expire?: number;
  retryInterval?: number;
  maxRetryTimes?: number;
}
