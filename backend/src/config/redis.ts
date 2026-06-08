export type RedisConfig = {
  enabled: boolean;
  host: string;
  port: number;
  password?: string;
  db: number;
};

export function resolveRedisConfig(): RedisConfig {
  const enabled = process.env.REDIS_ENABLED === 'true';
  return {
    enabled,
    host: process.env.REDIS_HOST?.trim() || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10) || 6379,
    password: process.env.REDIS_PASSWORD?.trim() || undefined,
    db: parseInt(process.env.REDIS_DB ?? '0', 10) || 0,
  };
}
