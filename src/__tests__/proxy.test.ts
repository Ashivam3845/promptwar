import { describe, it, expect, beforeAll, vi } from 'vitest';
import { NextRequest } from 'next/server';

// The proxy only enforces rules when Supabase is configured; set env before importing it.
let proxy: (req: NextRequest) => Promise<Response>;

beforeAll(async () => {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_test');
  ({ proxy } = await import('../proxy'));
});

const request = (path: string, init: { method?: string; cookie?: string; ip?: string } = {}) =>
  new NextRequest(`http://localhost:3000${path}`, {
    method: init.method ?? 'GET',
    headers: {
      ...(init.cookie ? { cookie: init.cookie } : {}),
      'x-forwarded-for': init.ip ?? '203.0.113.1',
    },
  });

describe('proxy access rules (anonymous visitor)', () => {
  it('lets guests use the landing page, Ask AI, schemes and complaint drafting', async () => {
    for (const path of ['/', '/assistant', '/schemes', '/complaints', '/login']) {
      const res = await proxy(request(path));
      expect(res.headers.get('location'), path).toBeNull();
    }
  });

  it('sends guests to login (remembering where they were going) for personal pages', async () => {
    const res = await proxy(request('/tracker?add=1'));
    const location = new URL(res.headers.get('location')!);
    expect(location.pathname).toBe('/login');
    expect(location.searchParams.get('next')).toBe('/tracker?add=1');
  });

  it('lets demo visitors into the workspace but not account-only pages', async () => {
    const dashboard = await proxy(request('/dashboard', { cookie: 'gigsaathi_demo=1' }));
    expect(dashboard.headers.get('location')).toBeNull();

    const onboarding = await proxy(request('/onboarding', { cookie: 'gigsaathi_demo=1' }));
    expect(new URL(onboarding.headers.get('location')!).pathname).toBe('/login');

    const admin = await proxy(request('/admin', { cookie: 'gigsaathi_demo=1' }));
    expect(new URL(admin.headers.get('location')!).pathname).toBe('/login');
  });

  it('rate-limits anonymous AI requests per IP', async () => {
    const ip = '198.51.100.7';
    const statuses: number[] = [];
    for (let i = 0; i < 21; i++) {
      statuses.push((await proxy(request('/api/chat', { method: 'POST', ip }))).status);
    }
    expect(statuses.slice(0, 20).every((s) => s !== 429)).toBe(true);
    expect(statuses[20]).toBe(429);

    // Another visitor is unaffected.
    const other = await proxy(request('/api/chat', { method: 'POST', ip: '198.51.100.8' }));
    expect(other.status).not.toBe(429);
  });
});
