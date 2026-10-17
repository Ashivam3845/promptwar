import { EarningsCalculationResult, EarningsRecord } from '@/types';

/**
 * Deterministic formula:
 * Total Income = Gross Earnings + Bonuses & Incentives
 * Total Expenses = Fuel Expenses + Other Expenses
 * Net Income = Total Income - Total Expenses - Platform Deductions
 * Effective Hourly Rate = Net Income / Hours Worked (when hoursWorked > 0)
 */

export interface RawEarningsInput {
  grossEarnings?: number | string;
  incentives?: number | string;
  fuelExpenses?: number | string;
  otherExpenses?: number | string;
  platformDeductions?: number | string;
  hoursWorked?: number | string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export function parseNonNegativeNumber(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0;
  const num = typeof value === 'number' ? value : parseFloat(String(value));
  if (isNaN(num) || !isFinite(num)) return 0;
  return Math.max(0, Math.round(num * 100) / 100);
}

export function validateEarningsInput(input: RawEarningsInput & { workDate?: string; description?: string }): ValidationResult {
  const errors: Record<string, string> = {};

  if (!input.workDate || !input.workDate.trim()) {
    errors.workDate = 'Work date is required.';
  } else {
    const parsedDate = new Date(input.workDate);
    if (isNaN(parsedDate.getTime())) {
      errors.workDate = 'Invalid date format.';
    } else {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (parsedDate > today) {
        errors.workDate = 'Work date cannot be in the future.';
      }
    }
  }

  const checkNonNegative = (val: unknown, fieldName: string, label: string) => {
    if (val !== undefined && val !== null && val !== '') {
      const num = typeof val === 'number' ? val : Number(val);
      if (isNaN(num)) {
        errors[fieldName] = `${label} must be a valid number.`;
      } else if (num < 0) {
        errors[fieldName] = `${label} cannot be negative.`;
      }
    }
  };

  checkNonNegative(input.grossEarnings, 'grossEarnings', 'Gross earnings');
  checkNonNegative(input.incentives, 'incentives', 'Bonuses/Incentives');
  checkNonNegative(input.fuelExpenses, 'fuelExpenses', 'Fuel expenses');
  checkNonNegative(input.otherExpenses, 'otherExpenses', 'Other expenses');
  checkNonNegative(input.platformDeductions, 'platformDeductions', 'Platform deductions');
  checkNonNegative(input.hoursWorked, 'hoursWorked', 'Hours worked');

  if (input.hoursWorked !== undefined && input.hoursWorked !== null && input.hoursWorked !== '') {
    const hours = Number(input.hoursWorked);
    if (hours > 24) {
      errors.hoursWorked = 'Hours worked in a single day cannot exceed 24.';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function calculateEarnings(input: RawEarningsInput): EarningsCalculationResult {
  const grossEarnings = parseNonNegativeNumber(input.grossEarnings);
  const incentives = parseNonNegativeNumber(input.incentives);
  const fuelExpenses = parseNonNegativeNumber(input.fuelExpenses);
  const otherExpenses = parseNonNegativeNumber(input.otherExpenses);
  const platformDeductions = parseNonNegativeNumber(input.platformDeductions);
  const hoursWorked = parseNonNegativeNumber(input.hoursWorked);

  const totalIncome = Math.round((grossEarnings + incentives) * 100) / 100;
  const totalExpenses = Math.round((fuelExpenses + otherExpenses) * 100) / 100;
  const totalDeductions = Math.round(platformDeductions * 100) / 100;
  const netEarnings = Math.round((totalIncome - totalExpenses - totalDeductions) * 100) / 100;

  const effectiveHourlyRate = hoursWorked > 0 ? Math.round((netEarnings / hoursWorked) * 100) / 100 : null;

  return {
    grossEarnings,
    incentives,
    fuelExpenses,
    otherExpenses,
    platformDeductions,
    hoursWorked,
    totalIncome,
    totalExpenses,
    totalDeductions,
    netEarnings,
    effectiveHourlyRate,
  };
}

export interface EarningsSummary {
  shifts: number;
  totalGross: number; // base pay + incentives
  totalExpenses: number;
  totalDeductions: number;
  totalNet: number;
  totalHours: number;
  avgHourlyRate: number; // 0 when no hours recorded
}

/** Aggregates recorded shifts in a single pass. */
export function summarizeEarnings(
  records: Pick<EarningsRecord, 'grossEarnings' | 'incentives' | 'totalExpenses' | 'platformDeductions' | 'netEarnings' | 'hoursWorked'>[]
): EarningsSummary {
  const sum = { totalGross: 0, totalExpenses: 0, totalDeductions: 0, totalNet: 0, totalHours: 0 };
  for (const r of records) {
    sum.totalGross += r.grossEarnings + r.incentives;
    sum.totalExpenses += r.totalExpenses;
    sum.totalDeductions += r.platformDeductions;
    sum.totalNet += r.netEarnings;
    sum.totalHours += r.hoursWorked;
  }
  const round = (n: number) => Math.round(n * 100) / 100;
  return {
    shifts: records.length,
    totalGross: round(sum.totalGross),
    totalExpenses: round(sum.totalExpenses),
    totalDeductions: round(sum.totalDeductions),
    totalNet: round(sum.totalNet),
    totalHours: round(sum.totalHours),
    avgHourlyRate: sum.totalHours > 0 ? round(sum.totalNet / sum.totalHours) : 0,
  };
}
