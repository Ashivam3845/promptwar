import { describe, it, expect } from 'vitest';
import {
  calculateEarnings,
  validateEarningsInput,
  parseNonNegativeNumber,
} from '../lib/calculations';

describe('Earnings Engine - Deterministic Calculations', () => {
  it('correctly calculates net earnings using the documented formula', () => {
    // Formula: (Gross + Incentives) - (Fuel + Other) - Deductions
    const result = calculateEarnings({
      grossEarnings: 1000,
      incentives: 200,
      fuelExpenses: 150,
      otherExpenses: 50,
      platformDeductions: 100,
      hoursWorked: 6,
    });

    expect(result.totalIncome).toBe(1200); // 1000 + 200
    expect(result.totalExpenses).toBe(200); // 150 + 50
    expect(result.totalDeductions).toBe(100);
    expect(result.netEarnings).toBe(900); // 1200 - 200 - 100
    expect(result.effectiveHourlyRate).toBe(150); // 900 / 6
  });

  it('handles zero hours worked gracefully without dividing by zero', () => {
    const result = calculateEarnings({
      grossEarnings: 500,
      incentives: 0,
      fuelExpenses: 100,
      otherExpenses: 0,
      platformDeductions: 0,
      hoursWorked: 0,
    });

    expect(result.netEarnings).toBe(400);
    expect(result.effectiveHourlyRate).toBeNull();
  });

  it('handles negative or invalid number values via sanitization', () => {
    expect(parseNonNegativeNumber(-50)).toBe(0);
    expect(parseNonNegativeNumber('invalid')).toBe(0);
    expect(parseNonNegativeNumber(undefined)).toBe(0);
    expect(parseNonNegativeNumber('250.75')).toBe(250.75);
  });

  it('validates required fields and boundary rules', () => {
    const invalidDate = validateEarningsInput({
      workDate: '',
      grossEarnings: 500,
    });
    expect(invalidDate.isValid).toBe(false);
    expect(invalidDate.errors.workDate).toBeDefined();

    const futureDate = validateEarningsInput({
      workDate: '2099-01-01',
      grossEarnings: 500,
    });
    expect(futureDate.isValid).toBe(false);
    expect(futureDate.errors.workDate).toContain('cannot be in the future');

    const negativeInput = validateEarningsInput({
      workDate: '2026-10-15',
      grossEarnings: -100,
    });
    expect(negativeInput.isValid).toBe(false);
    expect(negativeInput.errors.grossEarnings).toContain('cannot be negative');

    const excessiveHours = validateEarningsInput({
      workDate: '2026-10-15',
      hoursWorked: 26,
    });
    expect(excessiveHours.isValid).toBe(false);
    expect(excessiveHours.errors.hoursWorked).toContain('cannot exceed 24');
  });
});
