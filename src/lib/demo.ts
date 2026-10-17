// Demo mode lets visitors explore the app with sample data and no account.
// The flag is a cookie (not localStorage) so proxy.ts can let demo visitors into app pages.
export const DEMO_COOKIE = 'gigsaathi_demo';

export function isDemoCookieSet(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.split('; ').some((c) => c === `${DEMO_COOKIE}=1`);
}

const listeners = new Set<() => void>();

// For useSyncExternalStore: re-render subscribers when the demo flag changes.
export function subscribeDemo(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setDemoCookie(enabled: boolean): void {
  if (typeof document === 'undefined') return;
  document.cookie = enabled
    ? `${DEMO_COOKIE}=1; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
    : `${DEMO_COOKIE}=; path=/; max-age=0; samesite=lax`;
  listeners.forEach((l) => l());
}
