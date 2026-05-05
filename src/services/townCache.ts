const CACHE_PREFIX = "homebase_v1_";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

interface CacheEntry {
  data: Record<string, any>;
  timestamp: number;
}

function buildKey(townName: string): string {
  return `${CACHE_PREFIX}${townName}`;
}

export function getCachedTownData(townName: string): Record<string, any> | null {
  const key = buildKey(townName);

  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;

    const entry: CacheEntry = JSON.parse(raw);
    const now = Date.now();

    if (now - entry.timestamp > TTL_MS) {
      // Entry is stale — delete it and signal a cache miss
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore removal errors
      }
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

export function setCachedTownData(
  townName: string,
  data: Record<string, any>
): void {
  const key = buildKey(townName);
  const entry: CacheEntry = { data, timestamp: Date.now() };

  try {
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // Silently fail if localStorage is unavailable or quota is exceeded
  }
}

export function clearTownCache(): void {
  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key !== null && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore individual removal errors
      }
    }
  } catch {
    // Silently fail if localStorage is unavailable
  }
}
