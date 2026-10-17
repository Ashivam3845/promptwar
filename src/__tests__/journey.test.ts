import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { summarizeEarnings } from '../lib/calculations';
import { toUserProfile, toProfileColumns, describeAuthError } from '../lib/auth';
import { createSupabaseStore, demoStore, DataStoreError } from '../lib/workspace';
import { stashPendingDraft, takePendingDraft, hasPendingDraft } from '../lib/pendingDraft';
import { createPreference } from '../lib/preferences';
import { stateToJurisdiction, isKnownPlatform } from '../lib/profileOptions';
import { fill } from '../lib/i18n-journey';
import { translations } from '../lib/i18n';
import type { AuthError } from '@supabase/supabase-js';
import type { ComplaintDraft } from '../types';

// Minimal in-memory localStorage for the node test environment.
function installLocalStorage() {
  const data = new Map<string, string>();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
  });
  vi.stubGlobal('window', globalThis);
  return data;
}

const authUser = (overrides: Partial<User> = {}): User =>
  ({
    id: 'u-1',
    email: 'worker@example.com',
    created_at: '2026-10-17T00:00:00Z',
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    ...overrides,
  }) as User;

describe('summarizeEarnings', () => {
  it('returns zeros for a new user with no shifts (no fabricated numbers)', () => {
    expect(summarizeEarnings([])).toEqual({
      shifts: 0,
      totalGross: 0,
      totalExpenses: 0,
      totalDeductions: 0,
      totalNet: 0,
      totalHours: 0,
      avgHourlyRate: 0,
    });
  });

  it('aggregates shifts and computes the hourly rate', () => {
    const summary = summarizeEarnings([
      { grossEarnings: 1000, incentives: 200, totalExpenses: 300, platformDeductions: 100, netEarnings: 800, hoursWorked: 8 },
      { grossEarnings: 500, incentives: 0, totalExpenses: 100, platformDeductions: 0, netEarnings: 400, hoursWorked: 4 },
    ]);
    expect(summary.totalGross).toBe(1700);
    expect(summary.totalNet).toBe(1200);
    expect(summary.totalHours).toBe(12);
    expect(summary.avgHourlyRate).toBe(100);
  });
});

describe('toUserProfile', () => {
  it('never grants admin from user-editable metadata', () => {
    const profile = toUserProfile(authUser({ user_metadata: { role: 'admin' } }));
    expect(profile.role).toBe('worker');
  });

  it('grants admin only from app_metadata', () => {
    expect(toUserProfile(authUser({ app_metadata: { role: 'admin' } })).role).toBe('admin');
  });

  it('maps onboarding fields and rejects invalid values', () => {
    const profile = toUserProfile(
      authUser({
        user_metadata: {
          full_name: 'Asha',
          work_type: 'astronaut',
          preferred_language: 'fr',
          state: 'Punjab',
          onboarded: true,
        },
      })
    );
    expect(profile.fullName).toBe('Asha');
    expect(profile.workType).toBeUndefined();
    expect(profile.preferredLanguage).toBe('en');
    expect(profile.state).toBe('Punjab');
    expect(profile.onboarded).toBe(true);
  });

  it('treats a fresh signup as not onboarded', () => {
    expect(toUserProfile(authUser()).onboarded).toBe(false);
  });
});

describe('toProfileColumns', () => {
  it('converts to snake_case and drops undefined fields', () => {
    expect(toProfileColumns({ fullName: 'Asha', workType: 'driver', city: undefined })).toEqual({
      full_name: 'Asha',
      work_type: 'driver',
    });
  });
});

describe('describeAuthError', () => {
  it('turns Supabase error codes into plain messages', () => {
    expect(describeAuthError({ code: 'invalid_credentials', message: 'x' } as AuthError)).toBe('Incorrect email or password.');
    expect(describeAuthError({ code: 'unknown', message: 'Raw' } as AuthError)).toBe('Raw');
  });
});

// A chainable stand-in for the Supabase query builder that records calls.
function fakeSupabase(result: { data: unknown; error: unknown }) {
  const calls: { table: string; ops: string[] } = { table: '', ops: [] };
  const builder: Record<string, unknown> = {};
  for (const op of ['select', 'order', 'insert', 'update', 'delete', 'eq', 'limit']) {
    builder[op] = vi.fn(() => {
      calls.ops.push(op);
      return builder;
    });
  }
  builder.single = vi.fn(async () => result);
  builder.then = (resolve: (v: unknown) => unknown) => resolve(result);
  const client = {
    from: vi.fn((table: string) => {
      calls.table = table;
      return builder;
    }),
    auth: { getUser: vi.fn(async () => ({ data: { user: { id: 'u-1' } } })) },
  };
  return { client: client as never, calls };
}

describe('createSupabaseStore', () => {
  const row = {
    id: '6f1c2a8e-1111-4c4c-9999-000000000001',
    user_id: 'u-1',
    work_date: '2026-10-16',
    platform: 'Zomato',
    description: 'Dinner rush',
    gross_earnings: 1000,
    incentives: 200,
    fuel_expenses: 150,
    other_expenses: 50,
    platform_deductions: 100,
    hours_worked: 5,
    created_at: '2026-10-16T20:00:00Z',
    updated_at: '2026-10-16T20:00:00Z',
  };

  it('returns an empty list for a new user instead of sample data', async () => {
    const { client } = fakeSupabase({ data: [], error: null });
    expect(await createSupabaseStore(client).listEarnings()).toEqual([]);
  });

  it('maps rows and recomputes derived fields', async () => {
    const { client } = fakeSupabase({ data: [row], error: null });
    const [record] = await createSupabaseStore(client).listEarnings();
    expect(record.netEarnings).toBe(900);
    expect(record.totalExpenses).toBe(200);
    expect(record.effectiveHourlyRate).toBe(180);
    expect(record.userId).toBe('u-1');
  });

  it('inserts new records and updates existing UUID records', async () => {
    const insert = fakeSupabase({ data: row, error: null });
    const input = { workDate: '2026-10-16', platform: 'Zomato' as const, description: '', grossEarnings: 1000, incentives: 200, fuelExpenses: 150, otherExpenses: 50, platformDeductions: 100, hoursWorked: 5 };
    await createSupabaseStore(insert.client).saveEarning({ ...input, id: 'rec-local-123' });
    expect(insert.calls.ops).toContain('insert');

    const update = fakeSupabase({ data: row, error: null });
    await createSupabaseStore(update.client).saveEarning({ ...input, id: row.id });
    expect(update.calls.ops).toContain('update');
    expect(update.calls.ops).toContain('eq');
  });

  it('explains a missing database instead of failing silently', async () => {
    const { client } = fakeSupabase({ data: null, error: { code: 'PGRST205', message: 'not found' } });
    await expect(createSupabaseStore(client).listComplaints()).rejects.toThrow(DataStoreError);
    await expect(createSupabaseStore(client).listComplaints()).rejects.toThrow(/migrations/);
  });
});

describe('demo isolation', () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it('keeps demo data under demo-scoped keys only', async () => {
    const storage = installLocalStorage();
    const records = await demoStore.listEarnings();
    expect(records.length).toBeGreaterThan(0);
    const keys = [...storage.keys()];
    expect(keys.length).toBeGreaterThan(0);
    expect(keys.every((k) => k.startsWith('gigsaathi_demo_'))).toBe(true);
  });
});

describe('pending guest draft', () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it('survives sign-up and is handed back exactly once', () => {
    const draft = { id: 'draft-gen-1', title: 'Unfair penalty' } as ComplaintDraft;
    expect(hasPendingDraft()).toBe(false);
    stashPendingDraft(draft);
    expect(hasPendingDraft()).toBe(true);
    expect(takePendingDraft()?.title).toBe('Unfair penalty');
    expect(takePendingDraft()).toBeNull();
  });
});

describe('createPreference', () => {
  beforeEach(() => {
    installLocalStorage();
  });

  it('persists allowed values, ignores invalid stored values and notifies subscribers', () => {
    localStorage.setItem('pref_test', 'purple');
    const pref = createPreference('pref_test', ['light', 'dark'] as const, 'dark');
    expect(pref.get()).toBe('dark');
    expect(pref.getServer()).toBe('dark');

    const listener = vi.fn();
    const unsubscribe = pref.subscribe(listener);
    pref.set('light');
    expect(pref.get()).toBe('light');
    expect(localStorage.getItem('pref_test')).toBe('light');
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
    pref.set('dark');
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('profile options and i18n', () => {
  it('maps states to scheme jurisdictions', () => {
    expect(stateToJurisdiction('Delhi')).toBe('Delhi NCT');
    expect(stateToJurisdiction('Rajasthan')).toBe('Rajasthan');
    expect(stateToJurisdiction(undefined)).toBeUndefined();
  });

  it('recognises only supported platforms', () => {
    expect(isKnownPlatform('Swiggy')).toBe(true);
    expect(isKnownPlatform('Rapido')).toBe(false);
    expect(isKnownPlatform(undefined)).toBe(false);
  });

  it('fills placeholders', () => {
    expect(fill('Welcome, {name}!', { name: 'Asha' })).toBe('Welcome, Asha!');
  });

  it('has every onboarding and journey string in all three languages', () => {
    for (const lang of ['hi', 'pa'] as const) {
      expect(Object.keys(translations[lang].onboarding)).toEqual(Object.keys(translations.en.onboarding));
      expect(Object.keys(translations[lang].journey)).toEqual(Object.keys(translations.en.journey));
      expect(translations[lang].landing.features).toHaveLength(translations.en.landing.features.length);
    }
  });
});
