import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from './redis.constants';
import { lockOption } from './redis.interface';
import { RedisService } from './redis.service';
export const InjectRedis = () => Inject(REDIS_CLIENT);
interface GetLockNameFunc {
  (target: any, ...args): string;
}

/**
 * Wrap a method, starting with getting a lock, ending with unlocking
 * @param {string} name lock name
 * @param {number} [retryInterval]  milliseconds, the interval to retry
 * @param {number} [maxRetryTimes]  max times to retry
 */
export function RedisLock(
  lockName?: string | GetLockNameFunc,
  options?: lockOption,
) {
  return function (target, key, descriptor) {
    console.log(key, 'key');
    const value = descriptor.value;
    const serviceName = 'redisService';
    Inject(RedisService)(target, serviceName);
    const getLockService = (that): RedisService => {
      let lockService: RedisService;
      for (const i in that) {
        if (that[i] instanceof RedisService) {
          lockService = that[i];
          break;
        }
      }
      if (!lockService) {
        throw new Error('RedisLock: cannot find the instance of RedisService');
      }
      return lockService;
    };
    descriptor.value = async function (...args) {
      const lockService = getLockService(this);
      let name: string;
      if (typeof lockName === 'string') {
        name = lockName;
      } else if (typeof lockName === 'function') {
        name = lockName(this, ...args);
      } else {
        name = key;
      }
      try {
        await lockService.lock(name, options);
        return await value.call(this, ...args);
      } finally {
        lockService.unlock(name);
      }
    };
    return descriptor;
  };
}

export function BufferLock(
  lockName?: string | GetLockNameFunc,
  options?: lockOption,
) {
  return RedisLock(lockName, options);
}
export function MutexLock(lockName?: string | GetLockNameFunc) {
  return RedisLock(lockName, { maxRetryTimes: 0 });
}
