import { EarningsRecord, WorkType } from '@/types';

export const WORK_TYPE_OPTIONS: WorkType[] = ['delivery', 'driver', 'daily_wage', 'other'];

type Platform = EarningsRecord['platform'];

export const ALL_PLATFORMS: Platform[] = [
  'Zomato',
  'Swiggy',
  'Blinkit',
  'Zepto',
  'Porter',
  'Uber',
  'Ola',
  'Urban Company',
  'Daily Wage / Construction',
  'Other',
];

export const PLATFORMS_BY_WORK_TYPE: Record<WorkType, Platform[]> = {
  delivery: ['Zomato', 'Swiggy', 'Blinkit', 'Zepto', 'Porter', 'Other'],
  driver: ['Uber', 'Ola', 'Porter', 'Other'],
  daily_wage: ['Daily Wage / Construction', 'Urban Company', 'Other'],
  other: ALL_PLATFORMS,
};

export function isKnownPlatform(value: string | undefined): value is Platform {
  return Boolean(value) && (ALL_PLATFORMS as string[]).includes(value as string);
}

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan',
  'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

// Scheme jurisdictions use slightly different names from the state list.
export function stateToJurisdiction(state: string | undefined): string | undefined {
  if (!state) return undefined;
  return state === 'Delhi' ? 'Delhi NCT' : state;
}
