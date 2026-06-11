export type RedisConfig = {
  enabled: boolean;
  host: string;
  port: number;
  password?: string;
  db: number;
};

export function resolveRedisConfig(): RedisConfig {
  const enabled = process.env.REDIS_ENABLED === 'true';
  const host = process.env.REDIS_HOST?.trim() || '127.0.0.1';
  return {
    enabled,
    // 127.0.0.1 avoids Windows resolving localhost to ::1 when Redis listens on IPv4 only.
    host: host === 'localhost' ? '127.0.0.1' : host,
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10) || 6379,
    password: process.env.REDIS_PASSWORD?.trim() || undefined,
    db: parseInt(process.env.REDIS_DB ?? '0', 10) || 0,
  };
}
