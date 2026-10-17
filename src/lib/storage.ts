import { EarningsRecord } from '@/types';
import { calculateEarnings } from './calculations';
import { supabase, isSupabaseConfigured } from './supabase';

export const INITIAL_DEMO_EARNINGS: EarningsRecord[] = [
  {
    id: 'demo-rec-1',
    workDate: '2026-10-16',
    platform: 'Zomato',
    description: 'Dinner peak rush + 14 orders completed in Indiranagar',
    grossEarnings: 1250,
    incentives: 350,
    fuelExpenses: 280,
    otherExpenses: 60,
    platformDeductions: 50,
    hoursWorked: 7.5,
    totalExpenses: 340,
    netEarnings: 1210,
    effectiveHourlyRate: 161.33,
    createdAt: new Date('2026-10-16T22:30:00Z').toISOString(),
    updatedAt: new Date('2026-10-16T22:30:00Z').toISOString(),
  },
  {
    id: 'demo-rec-2',
    workDate: '2026-10-15',
    platform: 'Swiggy',
    description: 'Lunch surge + rain allowance in Koramangala',
    grossEarnings: 980,
    incentives: 220,
    fuelExpenses: 210,
    otherExpenses: 50,
    platformDeductions: 0,
    hoursWorked: 6.0,
    totalExpenses: 260,
    netEarnings: 940,
    effectiveHourlyRate: 156.67,
    createdAt: new Date('2026-10-15T18:00:00Z').toISOString(),
    updatedAt: new Date('2026-10-15T18:00:00Z').toISOString(),
  },
  {
    id: 'demo-rec-3',
    workDate: '2026-10-14',
    platform: 'Blinkit',
    description: 'Morning dark-store slot delivery',
    grossEarnings: 750,
    incentives: 100,
    fuelExpenses: 150,
    otherExpenses: 30,
    platformDeductions: 100, // Disputed deduction
    hoursWorked: 5.0,
    totalExpenses: 180,
    netEarnings: 570,
    effectiveHourlyRate: 114.0,
    createdAt: new Date('2026-10-14T14:30:00Z').toISOString(),
    updatedAt: new Date('2026-10-14T14:30:00Z').toISOString(),
  },
  {
    id: 'demo-rec-4',
    workDate: '2026-10-13',
    platform: 'Uber',
    description: 'Airport rides and city drops',
    grossEarnings: 2100,
    incentives: 400,
    fuelExpenses: 650,
    otherExpenses: 120,
    platformDeductions: 380, // Platform commission cut
    hoursWorked: 9.0,
    totalExpenses: 770,
    netEarnings: 1350,
    effectiveHourlyRate: 150.0,
    createdAt: new Date('2026-10-13T21:00:00Z').toISOString(),
    updatedAt: new Date('2026-10-13T21:00:00Z').toISOString(),
  }
];

// Demo-mode only. Sample shifts live in this browser under a demo-scoped key and are never
// mixed with a signed-in user's records (those are stored in Supabase, see lib/workspace).
const LOCAL_STORAGE_KEY = 'gigsaathi_demo_earnings_v1';

export function getLocalEarningsRecords(): EarningsRecord[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_EARNINGS;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_EARNINGS));
      return INITIAL_DEMO_EARNINGS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_EARNINGS;
  }
}

export function saveLocalEarningsRecord(
  recordInput: Omit<EarningsRecord, 'id' | 'totalExpenses' | 'netEarnings' | 'effectiveHourlyRate' | 'createdAt' | 'updatedAt'> & { id?: string }
): EarningsRecord {
  const current = getLocalEarningsRecords();
  const calculated = calculateEarnings(recordInput);
  const now = new Date().toISOString();

  if (recordInput.id) {
    const index = current.findIndex((r) => r.id === recordInput.id);
    if (index >= 0) {
      const updatedRecord: EarningsRecord = {
        ...current[index],
        ...recordInput,
        totalExpenses: calculated.totalExpenses,
        netEarnings: calculated.netEarnings,
        effectiveHourlyRate: calculated.effectiveHourlyRate,
        updatedAt: now,
      };
      current[index] = updatedRecord;
      if (typeof window !== 'undefined') {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(current));
      }
      return updatedRecord;
    }
  }

  const newRecord: EarningsRecord = {
    id: 'rec-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    workDate: recordInput.workDate,
    description: recordInput.description || '',
    platform: recordInput.platform,
    grossEarnings: calculated.grossEarnings,
    incentives: calculated.incentives,
    fuelExpenses: calculated.fuelExpenses,
    otherExpenses: calculated.otherExpenses,
    platformDeductions: calculated.platformDeductions,
    hoursWorked: calculated.hoursWorked,
    totalExpenses: calculated.totalExpenses,
    netEarnings: calculated.netEarnings,
    effectiveHourlyRate: calculated.effectiveHourlyRate,
    createdAt: now,
    updatedAt: now,
  };

  const updated = [newRecord, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  }
  return newRecord;
}

export function deleteLocalEarningsRecord(id: string): void {
  const current = getLocalEarningsRecords();
  const filtered = current.filter((r) => r.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
  }
}

export function resetDemoEarningsRecords(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_EARNINGS));
  }
}

// Convert Supabase DB row to EarningsRecord
export function mapRowToEarningsRecord(row: any): EarningsRecord {
  const gross = Number(row.gross_earnings || 0);
  const inc = Number(row.incentives || 0);
  const fuel = Number(row.fuel_expenses || 0);
  const other = Number(row.other_expenses || 0);
  const deductions = Number(row.platform_deductions || 0);
  const hours = Number(row.hours_worked || 0);
  const totalExp = fuel + other;
  const net = row.net_earnings !== undefined && row.net_earnings !== null
    ? Number(row.net_earnings)
    : (gross + inc) - totalExp - deductions;
  const hourlyRate = hours > 0 ? Number((net / hours).toFixed(2)) : null;

  return {
    id: String(row.id),
    userId: row.user_id,
    workDate: row.work_date,
    platform: row.platform,
    description: row.description || '',
    grossEarnings: gross,
    incentives: inc,
    fuelExpenses: fuel,
    otherExpenses: other,
    platformDeductions: deductions,
    hoursWorked: hours,
    totalExpenses: totalExp,
    netEarnings: net,
    effectiveHourlyRate: hourlyRate,
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
  };
}

// Asynchronous Supabase-backed API with fallback to local storage
export async function fetchEarningsRecords(): Promise<EarningsRecord[]> {
  if (typeof window === 'undefined') return INITIAL_DEMO_EARNINGS;
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session) {
        const { data, error } = await supabase
          .from('earnings_records')
          .select('*')
          .order('work_date', { ascending: false });

        if (!error && data && data.length > 0) {
          const records = data.map(mapRowToEarningsRecord);
          // Keep local cache synced
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
          return records;
        }
      }
    } catch (err) {
      console.warn('Supabase fetchEarningsRecords error:', err);
    }
  }
  return getLocalEarningsRecords();
}

export async function saveEarningsRecord(
  recordInput: Omit<EarningsRecord, 'id' | 'totalExpenses' | 'netEarnings' | 'effectiveHourlyRate' | 'createdAt' | 'updatedAt'> & { id?: string }
): Promise<EarningsRecord> {
  const localRecord = saveLocalEarningsRecord(recordInput);

  if (typeof window !== 'undefined' && isSupabaseConfigured && supabase) {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (user) {
        const calculated = calculateEarnings(recordInput);
        const isUuid = recordInput.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(recordInput.id);

        if (isUuid) {
          const { data, error } = await supabase
            .from('earnings_records')
            .update({
              work_date: recordInput.workDate,
              platform: recordInput.platform,
              description: recordInput.description || '',
              gross_earnings: calculated.grossEarnings,
              incentives: calculated.incentives,
              fuel_expenses: calculated.fuelExpenses,
              other_expenses: calculated.otherExpenses,
              platform_deductions: calculated.platformDeductions,
              hours_worked: calculated.hoursWorked,
              updated_at: new Date().toISOString(),
            })
            .eq('id', recordInput.id)
            .select()
            .single();

          if (!error && data) {
            return mapRowToEarningsRecord(data);
          }
        } else {
          const { data, error } = await supabase
            .from('earnings_records')
            .insert({
              user_id: user.id,
              work_date: recordInput.workDate,
              platform: recordInput.platform,
              description: recordInput.description || '',
              gross_earnings: calculated.grossEarnings,
              incentives: calculated.incentives,
              fuel_expenses: calculated.fuelExpenses,
              other_expenses: calculated.otherExpenses,
              platform_deductions: calculated.platformDeductions,
              hours_worked: calculated.hoursWorked,
            })
            .select()
            .single();

          if (!error && data) {
            const mapped = mapRowToEarningsRecord(data);
            // Replace temporary local record with real DB record
            const current = getLocalEarningsRecords().filter(r => r.id !== localRecord.id);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify([mapped, ...current]));
            return mapped;
          }
        }
      }
    } catch (err) {
      console.warn('Supabase saveEarningsRecord error:', err);
    }
  }

  return localRecord;
}

export async function deleteEarningsRecord(id: string): Promise<void> {
  deleteLocalEarningsRecord(id);

  if (typeof window !== 'undefined' && isSupabaseConfigured && supabase) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        await supabase.from('earnings_records').delete().eq('id', id);
      }
    } catch (err) {
      console.warn('Supabase deleteEarningsRecord error:', err);
    }
  }
}

