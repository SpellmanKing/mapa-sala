import { createClient } from 'redis';

let client;

function getRedis() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });
    client.on('error', () => {
      // fail-open: se Redis falhar, o sistema continua com cache em memória
    });
    client.connect().catch(() => {});
  }
  return client;
}

const memoryFallback = new Map();

export async function cacheGet(key) {
  // Fallback em memória caso Redis não esteja disponível
  const mem = memoryFallback.get(key);
  if (mem && mem.expiresAt > Date.now()) return mem.value;

  try {
    const redis = getRedis();
    const val = await redis.get(key);
    if (!val) return null;
    return JSON.parse(val);
  } catch {
    return null;
  }
}

export async function cacheSet(key, value, ttlSeconds = 60) {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  memoryFallback.set(key, { value, expiresAt });

  try {
    const redis = getRedis();
    await redis.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch {
    // fail-open
  }
}

