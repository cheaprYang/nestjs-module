import { Module, OnModuleDestroy, DynamicModule } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisModuleOptions, RedisModuleAsyncOptions } from './redis.interface';
import { REDIS_MODULE_OPTIONS, REDIS_CLIENT } from './redis.constants';
import { ModuleRef } from '@nestjs/core';
import { createClient, createRedisLock } from './redis.provider';
import * as Redis from 'ioredis';
@Module({
  providers: [RedisService],
})
export class RedisModule implements OnModuleDestroy {
  constructor(private readonly moduleRef: ModuleRef) {}
  static forRoot(options: RedisModuleOptions): DynamicModule {
    const provider = createClient();
    const providerLock = createRedisLock();
    return {
      module: RedisModule,
      global: true,
      providers: [
        { provide: REDIS_MODULE_OPTIONS, useValue: options },
        provider,
        providerLock,
      ],
      exports: [provider, providerLock, RedisService],
    };
  }
  static forRootAsync(options: RedisModuleAsyncOptions): DynamicModule {
    const provider = createClient();
    const providerLock = createRedisLock();
    return {
      module: RedisModule,
      global: true,
      imports: options.imports,
      providers: [
        {
          provide: REDIS_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject,
        },
        provider,
        providerLock,
      ],
      exports: [provider, providerLock, RedisService],
    };
  }
  onModuleDestroy() {
    const redisClient = this.moduleRef.get<Redis.Redis | Redis.Cluster>(
      REDIS_CLIENT,
    );
    redisClient.disconnect();
  }
}
