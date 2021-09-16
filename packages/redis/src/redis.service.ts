import { Injectable, Logger } from '@nestjs/common';
import { Redis, Cluster, Ok } from 'ioredis';
import { InjectRedis } from './redis.decorator';
import { lockOption } from './redis.interface';

@Injectable()
export class RedisService {
  constructor(@InjectRedis() private readonly redisClient: Redis) {}
  public readonly uuid: string = RedisService.generateUuid();
  private readonly logger = new Logger(RedisService.name);
  public get redis(): Redis | Cluster {
    return this.redisClient;
  }
  /**
   *
   * @param {string} key
   */
  public async get(key: string): Promise<string | null> {
    return await this.redisClient.get(key);
  }
  /**
   *
   * @param {string} key
   */
  public async getJson<T = any>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);
    if (data) {
      return JSON.parse(data);
    }
    return null;
  }
  /**
   *
   * @param {string} key
   * @param {any}   data
   * @param {number} time
   */
  public async set(key: string, data: any, time?: number): Promise<Ok | null> {
    if (time) {
      return await this.redisClient.set(key, data, 'EX', time);
    } else {
      return await this.redisClient.set(key, data);
    }
  }

  /**
   *
   * @param {string} key
   * @param {any}   data
   * @param {number} time
   */
  public async setJson<T = Record<any, any>>(
    key: string,
    data: T,
    time?: number,
  ): Promise<Ok | null> {
    if (time) {
      return await this.redisClient.set(key, JSON.stringify(data), 'EX', time);
    } else {
      return await this.redisClient.set(key, JSON.stringify(data));
    }
  }

  /**
   *
   *  @param {string} key 删除
   */
  public async del(key: string): Promise<number> {
    return await this.redisClient.del(key);
  }

  public async hasKey(key: string): Promise<boolean> {
    const value = await this.redisClient.exists(key);
    if (value) return true;
    return false;
  }
  public async ttl(key: string): Promise<number> {
    return await this.redisClient.ttl(key);
  }

  public async disconnect(): Promise<void> {
    await this.redisClient.disconnect();
  }

  prefix(name): string {
    return `lock:${name}`;
  }
  private static generateUuid(): string {
    let d = Date.now();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
      /[xy]/g,
      (c: string) => {
        const r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
      },
    );
  }
  /**
   * Try to lock once
   * @param {string} name lock name
   * @param {number} [expire] milliseconds, TTL for the redis key
   * @returns {boolean} true: success, false: failed
   */
  public async lockOnce(name, expire) {
    const result = await this.redis.set(
      this.prefix(name),
      this.uuid,
      'PX',
      expire,
      'NX',
    );
    this.logger.debug(`lock: ${name}, result: ${result}`);
    return result !== null;
  }

  /**
   * Get a lock, automatically retrying if failed
   * @param {string} name lock name
   * @param {number} [retryInterval] milliseconds, the interval to retry if failed
   * @param {number} [maxRetryTimes] max times to retry
   */
  public async lock(name: string, options?: lockOption): Promise<void> {
    const {
      expire = 60000,
      retryInterval = 100,
      maxRetryTimes = 36000,
    } = options;
    let retryTimes = 0;
    while (true) {
      if (await this.lockOnce(name, expire)) {
        break;
      } else {
        await this.sleep(retryInterval);
        if (retryTimes >= maxRetryTimes) {
          throw new Error(`RedisLockService: locking ${name} timed out`);
        }
        retryTimes++;
      }
    }
  }

  /**
   * Unlock a lock by name
   * @param {string} name lock name
   */
  public async unlock(name) {
    const result = await this.redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      1,
      this.prefix(name),
      this.uuid,
    );
    this.logger.debug(`unlock: ${name}, result: ${result}`);
  }

  /**
   * Set TTL for a lock
   * @param {string} name lock name
   * @param {number} milliseconds TTL
   */
  public async setTTL(name, milliseconds) {
    const result = await this.redis.pexpire(this.prefix(name), milliseconds);
    this.logger.debug(`set TTL: ${name}, result: ${result}`);
  }

  /**
   * @param {number} ms milliseconds, the sleep interval
   */
  public sleep(ms: number): Promise<() => void> {
    return new Promise((resolve) => setTimeout(resolve, Number(ms)));
  }
}
