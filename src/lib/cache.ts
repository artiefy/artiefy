import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 15,
});

export const getCachedData = async <T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl?: number
): Promise<T> => {
  const cached = cache.get(key) as T | undefined;
  if (cached) return cached;

  const data = await fetchFn();
  cache.set(key, data, { ttl });
  return data;
};
