// A tiny persisted-preference store for useSyncExternalStore: reads localStorage on the client,
// returns the fallback during prerender, and notifies subscribers when the value changes.
export function createPreference<T extends string>(key: string, allowed: readonly T[], fallback: T) {
  const listeners = new Set<() => void>();
  let override: T | null = null;

  const read = (): T => {
    if (override) return override;
    try {
      const stored = localStorage.getItem(key) as T | null;
      return stored && allowed.includes(stored) ? stored : fallback;
    } catch {
      return fallback;
    }
  };

  return {
    get: read,
    getServer: (): T => fallback,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    set(value: T) {
      // Keep the value in memory too, so it still applies when storage is blocked.
      override = value;
      try {
        localStorage.setItem(key, value);
      } catch {
        // Storage unavailable (private mode): the in-memory value still applies this session.
      }
      listeners.forEach((l) => l());
    },
  };
}
