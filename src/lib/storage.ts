import { EarningsRecord } from '@/types';
import { calculateEarnings } from './calculations';

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

const LOCAL_STORAGE_KEY = 'gigsaathi_earnings_records_v1';

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
