import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { resolveRedisConfig } from '../../config/redis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private readonly config = resolveRedisConfig();
  private client: Redis | null = null;
  private connectFailed = false;

  isEnabled(): boolean {
    return this.config.enabled && !this.connectFailed;
  }

  private getClient(): Redis | null {
    if (!this.config.enabled || this.connectFailed) return null;
    if (this.client) return this.client;

    try {
      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
        connectTimeout: 2000,
      });
      this.client.on('error', (err) => {
        if (process.env.NODE_ENV !== 'production') {
          this.logger.warn(`Redis error: ${err.message}`);
        }
      });
      return this.client;
    } catch (err) {
      this.connectFailed = true;
      if (process.env.NODE_ENV !== 'production') {
        this.logger.warn('Redis client init failed — using PostgreSQL only.');
      }
      return null;
    }
  }

  async onModuleDestroy() {
    await this.client?.quit().catch(() => undefined);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const redis = this.getClient();
    if (!redis) return null;
    try {
      if (redis.status !== 'ready') await redis.connect();
      const raw = await redis.get(key);
      if (!raw) {
        if (process.env.NODE_ENV !== 'production') {
          this.logger.debug(`cache miss ${key}`);
        }
        return null;
      }
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`cache hit ${key}`);
      }
      return JSON.parse(raw) as T;
    } catch (err) {
      this.markUnavailable(err);
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    const redis = this.getClient();
    if (!redis) return;
    try {
      if (redis.status !== 'ready') await redis.connect();
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      this.markUnavailable(err);
    }
  }

  async del(key: string): Promise<void> {
    const redis = this.getClient();
    if (!redis) return;
    try {
      if (redis.status !== 'ready') await redis.connect();
      await redis.del(key);
      if (process.env.NODE_ENV !== 'production') {
        this.logger.debug(`cache invalidate ${key}`);
      }
    } catch (err) {
      this.markUnavailable(err);
    }
  }

  async delByPrefix(prefix: string): Promise<void> {
    const redis = this.getClient();
    if (!redis) return;
    try {
      if (redis.status !== 'ready') await redis.connect();
      let cursor = '0';
      do {
        const [next, keys] = await redis.scan(
          cursor,
          'MATCH',
          `${prefix}*`,
          'COUNT',
          50,
        );
        cursor = next;
        if (keys.length) await redis.del(...keys);
      } while (cursor !== '0');
    } catch (err) {
      this.markUnavailable(err);
    }
  }

  private markUnavailable(err: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis unavailable — fallback to DB (${msg})`);
    }
    this.connectFailed = true;
    void this.client?.quit().catch(() => undefined);
    this.client = null;
  }
}
