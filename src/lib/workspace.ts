import type { SupabaseClient, PostgrestError } from '@supabase/supabase-js';
import { ComplaintDraft, EarningsRecord, UserProfile, SupportedLanguage, WorkType } from '@/types';
import { calculateEarnings } from './calculations';
import {
  getLocalEarningsRecords,
  saveLocalEarningsRecord,
  deleteLocalEarningsRecord,
  resetDemoEarningsRecords,
} from './storage';
import {
  getLocalComplaints,
  saveLocalComplaint,
  deleteLocalComplaint,
  resetDemoComplaints,
} from './complaintStorage';

export type EarningsInput = Omit<
  EarningsRecord,
  'id' | 'totalExpenses' | 'netEarnings' | 'effectiveHourlyRate' | 'createdAt' | 'updatedAt'
> & { id?: string };

export type ComplaintInput = Omit<ComplaintDraft, 'id' | 'createdAt' | 'status'> & { id?: string };

// One interface for both workspaces so pages never need to know where data lives.
// - demo:     sample data in this browser only (lib/storage.ts, lib/complaintStorage.ts)
// - supabase: the signed-in user's own rows, isolated by Row Level Security
export interface DataStore {
  kind: 'demo' | 'supabase';
  listEarnings(): Promise<EarningsRecord[]>;
  saveEarning(input: EarningsInput): Promise<EarningsRecord>;
  deleteEarning(id: string): Promise<void>;
  listComplaints(): Promise<ComplaintDraft[]>;
  saveComplaint(input: ComplaintInput): Promise<ComplaintDraft>;
  deleteComplaint(id: string): Promise<void>;
  deleteAllData(): Promise<void>;
}

export class DataStoreError extends Error {}

function toDataStoreError(error: PostgrestError): DataStoreError {
  if (error.code === 'PGRST205' || error.code === '42P01') {
    return new DataStoreError(
      'Your database is not set up yet. Run the SQL files in supabase/migrations in the Supabase SQL editor.'
    );
  }
  return new DataStoreError(error.message || 'Could not reach the database. Please try again.');
}

export const demoStore: DataStore = {
  kind: 'demo',
  listEarnings: async () => getLocalEarningsRecords(),
  saveEarning: async (input) => saveLocalEarningsRecord(input),
  deleteEarning: async (id) => deleteLocalEarningsRecord(id),
  listComplaints: async () => getLocalComplaints(),
  saveComplaint: async (input) => saveLocalComplaint({ ...input, status: 'saved' }),
  deleteComplaint: async (id) => deleteLocalComplaint(id),
  deleteAllData: async () => {
    resetDemoEarningsRecords();
    resetDemoComplaints();
  },
};

// Explicit column lists: fetch only what the UI maps (net_earnings is recomputed client-side).
const EARNINGS_COLUMNS =
  'id,user_id,work_date,platform,description,gross_earnings,incentives,fuel_expenses,other_expenses,platform_deductions,hours_worked,created_at,updated_at';
const COMPLAINT_COLUMNS =
  'id,user_id,title,platform_or_employer,incident_date,amount_disputed,recipient_category,subject,formal_letter,facts_summary,legal_fairness_basis,requested_relief,supporting_evidence,language,status,created_at';
const PROFILE_COLUMNS =
  'id,email,full_name,phone_number,primary_platform,city,state,work_type,preferred_language,onboarded,created_at';
// Upper bound for the admin overview so the page stays fast as the network grows.
const ADMIN_ROW_LIMIT = 2000;

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* eslint-disable @typescript-eslint/no-explicit-any -- rows are mapped field by field below */
function rowToEarning(row: any): EarningsRecord {
  const calc = calculateEarnings({
    grossEarnings: row.gross_earnings,
    incentives: row.incentives,
    fuelExpenses: row.fuel_expenses,
    otherExpenses: row.other_expenses,
    platformDeductions: row.platform_deductions,
    hoursWorked: row.hours_worked,
  });
  return {
    id: row.id,
    userId: row.user_id,
    workDate: row.work_date,
    platform: row.platform,
    description: row.description ?? '',
    grossEarnings: calc.grossEarnings,
    incentives: calc.incentives,
    fuelExpenses: calc.fuelExpenses,
    otherExpenses: calc.otherExpenses,
    platformDeductions: calc.platformDeductions,
    hoursWorked: calc.hoursWorked,
    totalExpenses: calc.totalExpenses,
    netEarnings: calc.netEarnings,
    effectiveHourlyRate: calc.effectiveHourlyRate,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToComplaint(row: any): ComplaintDraft {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    platformOrEmployer: row.platform_or_employer,
    incidentDate: row.incident_date,
    amountDisputed: row.amount_disputed === null ? undefined : Number(row.amount_disputed),
    recipientCategory: row.recipient_category,
    subject: row.subject,
    formalLetter: row.formal_letter,
    factsSummary: row.facts_summary ?? [],
    legalFairnessBasis: row.legal_fairness_basis ?? [],
    requestedRelief: row.requested_relief ?? [],
    supportingEvidence: row.supporting_evidence ?? [],
    language: row.language,
    status: row.status,
    createdAt: row.created_at,
  };
}

function rowToProfile(row: any): UserProfile {
  return {
    id: row.id,
    email: row.email ?? '',
    fullName: row.full_name || row.email?.split('@')[0] || 'Worker',
    phoneNumber: row.phone_number ?? '',
    role: 'worker',
    primaryPlatform: row.primary_platform || '—',
    city: row.city || '—',
    state: row.state ?? undefined,
    workType: (row.work_type as WorkType | null) ?? undefined,
    preferredLanguage: (row.preferred_language as SupportedLanguage) || 'en',
    onboarded: row.onboarded ?? false,
    createdAt: row.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export function createSupabaseStore(client: SupabaseClient): DataStore {
  return {
    kind: 'supabase',

    async listEarnings() {
      const { data, error } = await client
        .from('earnings_records')
        .select(EARNINGS_COLUMNS)
        .order('work_date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw toDataStoreError(error);
      return data.map(rowToEarning);
    },

    async saveEarning(input) {
      const calc = calculateEarnings(input);
      const row = {
        work_date: input.workDate,
        platform: input.platform,
        description: input.description || '',
        gross_earnings: calc.grossEarnings,
        incentives: calc.incentives,
        fuel_expenses: calc.fuelExpenses,
        other_expenses: calc.otherExpenses,
        platform_deductions: calc.platformDeductions,
        hours_worked: calc.hoursWorked,
        updated_at: new Date().toISOString(),
      };
      const query =
        input.id && UUID_PATTERN.test(input.id)
          ? client.from('earnings_records').update(row).eq('id', input.id)
          : client.from('earnings_records').insert(row);
      const { data, error } = await query.select(EARNINGS_COLUMNS).single();
      if (error) throw toDataStoreError(error);
      return rowToEarning(data);
    },

    async deleteEarning(id) {
      const { error } = await client.from('earnings_records').delete().eq('id', id);
      if (error) throw toDataStoreError(error);
    },

    async listComplaints() {
      const { data, error } = await client
        .from('complaint_drafts')
        .select(COMPLAINT_COLUMNS)
        .order('created_at', { ascending: false });
      if (error) throw toDataStoreError(error);
      return data.map(rowToComplaint);
    },

    async saveComplaint(input) {
      const row = {
        title: input.title,
        platform_or_employer: input.platformOrEmployer,
        incident_date: input.incidentDate,
        amount_disputed: input.amountDisputed ?? null,
        recipient_category: input.recipientCategory,
        subject: input.subject,
        formal_letter: input.formalLetter,
        facts_summary: input.factsSummary,
        legal_fairness_basis: input.legalFairnessBasis,
        requested_relief: input.requestedRelief,
        supporting_evidence: input.supportingEvidence,
        language: input.language,
        status: 'saved',
        updated_at: new Date().toISOString(),
      };
      const query =
        input.id && UUID_PATTERN.test(input.id)
          ? client.from('complaint_drafts').update(row).eq('id', input.id)
          : client.from('complaint_drafts').insert(row);
      const { data, error } = await query.select(COMPLAINT_COLUMNS).single();
      if (error) throw toDataStoreError(error);
      return rowToComplaint(data);
    },

    async deleteComplaint(id) {
      const { error } = await client.from('complaint_drafts').delete().eq('id', id);
      if (error) throw toDataStoreError(error);
    },

    async deleteAllData() {
      // RLS limits these deletes to the caller's own rows; the filter is required by PostgREST.
      const { data } = await client.auth.getUser();
      const userId = data.user?.id;
      if (!userId) throw new DataStoreError('You are not signed in.');
      const results = await Promise.all(
        ['earnings_records', 'complaint_drafts'].map((table) => client.from(table).delete().eq('user_id', userId))
      );
      const failed = results.find((r) => r.error)?.error;
      if (failed) throw toDataStoreError(failed);
    },
  };
}

// Admin portal: everything visible to an admin under the is_admin() RLS policies.
export async function fetchAdminOverview(client: SupabaseClient) {
  const [profiles, earnings, complaints] = await Promise.all([
    client.from('profiles').select(PROFILE_COLUMNS).order('created_at', { ascending: false }).limit(ADMIN_ROW_LIMIT),
    client.from('earnings_records').select(EARNINGS_COLUMNS).order('work_date', { ascending: false }).limit(ADMIN_ROW_LIMIT),
    client.from('complaint_drafts').select(COMPLAINT_COLUMNS).order('created_at', { ascending: false }).limit(ADMIN_ROW_LIMIT),
  ]);
  const error = profiles.error || earnings.error || complaints.error;
  if (error) throw toDataStoreError(error);
  return {
    users: profiles.data.map(rowToProfile),
    earnings: earnings.data.map(rowToEarning),
    complaints: complaints.data.map(rowToComplaint),
  };
}
