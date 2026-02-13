interface CacheItem<T> {
  data: T;
  timestamp: number;
}

const DEFAULT_TTL = 60 * 60 * 1000; // 30 minutes in milliseconds

export const cache = {
  set: <T>(key: string, data: T): void => {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    };
    try {
      sessionStorage.setItem(`klarity_cache_${key}`, JSON.stringify(item));
    } catch (e) {
      console.warn("Cache write failed", e);
    }
  },

  get: <T>(key: string, ttl: number = DEFAULT_TTL): T | null => {
    try {
      const stored = sessionStorage.getItem(`klarity_cache_${key}`);
      if (!stored) return null;

      const item: CacheItem<T> = JSON.parse(stored);
      const isExpired = Date.now() - item.timestamp > ttl;

      if (isExpired) {
        sessionStorage.removeItem(`klarity_cache_${key}`);
        return null;
      }

      return item.data;
    } catch (e) {
      return null;
    }
  },

  remove: (key: string): void => {
    sessionStorage.removeItem(`klarity_cache_${key}`);
  },

  clear: (): void => {
    Object.keys(sessionStorage)
      .filter((key) => key.startsWith("klarity_cache_"))
      .forEach((key) => sessionStorage.removeItem(key));
  },
};
