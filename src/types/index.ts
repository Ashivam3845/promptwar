// GigSaathi AI - Type Definitions

export type SupportedLanguage = 'en' | 'hi' | 'pa';

export type UserRole = 'worker' | 'admin';

export type WorkType = 'delivery' | 'driver' | 'daily_wage' | 'other';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: UserRole;
  primaryPlatform: string;
  city: string;
  state?: string;
  workType?: WorkType;
  preferredLanguage: SupportedLanguage;
  onboarded?: boolean;
  createdAt: string;
}

// Editable profile fields collected during onboarding and in Settings.
export type ProfileUpdate = Partial<
  Pick<UserProfile, 'fullName' | 'phoneNumber' | 'primaryPlatform' | 'city' | 'state' | 'workType' | 'preferredLanguage' | 'onboarded'>
>;

export interface EarningsRecord {
  id: string;
  userId?: string;
  workDate: string; // YYYY-MM-DD
  description: string;
  platform: 'Zomato' | 'Swiggy' | 'Uber' | 'Ola' | 'Blinkit' | 'Zepto' | 'Porter' | 'Urban Company' | 'Daily Wage / Construction' | 'Other';
  grossEarnings: number;
  incentives: number;
  fuelExpenses: number;
  otherExpenses: number;
  platformDeductions: number;
  hoursWorked: number;
  // Deterministic computed fields
  totalExpenses: number;
  netEarnings: number;
  effectiveHourlyRate: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EarningsCalculationResult {
  grossEarnings: number;
  incentives: number;
  fuelExpenses: number;
  otherExpenses: number;
  platformDeductions: number;
  hoursWorked: number;
  totalIncome: number; // Gross + Incentives
  totalExpenses: number; // Fuel + Other
  totalDeductions: number; // Platform Deductions
  netEarnings: number; // (Gross + Incentives) - (Fuel + Other) - Deductions
  effectiveHourlyRate: number | null; // Net / Hours (null if hours <= 0)
}

export interface WelfareScheme {
  id: string;
  name: string;
  category: 'Social Security' | 'Health Insurance' | 'Pension' | 'Accident Insurance' | 'State Gig Welfare' | 'Maternity / Women';
  officialSourceUrl: string;
  jurisdiction: 'Central (All India)' | 'Rajasthan' | 'Karnataka' | 'Delhi NCT' | 'Maharashtra' | 'Tamil Nadu';
  eligibilityCriteria: string[];
  relevantExclusions: string[];
  verifiedBenefits: string[];
  applicationSteps: string[];
  lastVerifiedDate: string;
  isVerified: boolean;
  summary: {
    en: string;
    hi: string;
    pa: string;
  };
}

export interface ComplaintDraft {
  id: string;
  userId?: string;
  title: string;
  platformOrEmployer: string;
  incidentDate: string;
  amountDisputed?: number;
  recipientCategory: 'Company Grievance Cell' | 'State Labour Commissioner' | 'National Consumer Helpline (NCH)' | 'Police / Legal Cell';
  subject: string;
  formalLetter: string;
  factsSummary: string[];
  legalFairnessBasis: string[];
  requestedRelief: string[];
  supportingEvidence: string[];
  language: SupportedLanguage;
  status: 'draft' | 'saved' | 'resolved';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: {
    name: string;
    url: string;
  }[];
}
