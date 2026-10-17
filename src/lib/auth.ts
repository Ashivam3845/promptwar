import type { AuthError, User } from '@supabase/supabase-js';
import { UserProfile, SupportedLanguage, WorkType, ProfileUpdate } from '@/types';

export interface RegisterParams {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  primaryPlatform?: string;
  city?: string;
}

const WORK_TYPES: WorkType[] = ['delivery', 'driver', 'daily_wage', 'other'];
const LANGUAGES: SupportedLanguage[] = ['en', 'hi', 'pa'];

export const MIN_PASSWORD_LENGTH = 8;

// Maps a Supabase auth user to the app's profile shape.
// Profile fields live in user_metadata (set at signup, user-editable).
// The role comes from app_metadata, which only the service role can write, so users
// cannot promote themselves to admin. Grant admin with:
//   update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = '...';
export function toUserProfile(user: User): UserProfile {
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    email: user.email ?? '',
    fullName: meta.full_name || user.email?.split('@')[0] || 'User',
    phoneNumber: meta.phone_number || '',
    role: user.app_metadata?.role === 'admin' ? 'admin' : 'worker',
    primaryPlatform: meta.primary_platform || '',
    city: meta.city || '',
    state: meta.state || '',
    workType: WORK_TYPES.includes(meta.work_type) ? meta.work_type : undefined,
    preferredLanguage: LANGUAGES.includes(meta.preferred_language) ? meta.preferred_language : 'en',
    onboarded: meta.onboarded === true,
    createdAt: user.created_at,
  };
}

// Converts profile fields to the snake_case keys used in user_metadata and the profiles table.
export function toProfileColumns(update: ProfileUpdate): Record<string, unknown> {
  const columns: Record<string, unknown> = {
    full_name: update.fullName,
    phone_number: update.phoneNumber,
    primary_platform: update.primaryPlatform,
    city: update.city,
    state: update.state,
    work_type: update.workType,
    preferred_language: update.preferredLanguage,
    onboarded: update.onboarded,
  };
  return Object.fromEntries(Object.entries(columns).filter(([, v]) => v !== undefined));
}

// Shown in demo mode so sample data never looks like it belongs to a real account.
export const DEMO_PROFILE: UserProfile = {
  id: 'demo',
  email: 'demo@gigsaathi.local',
  fullName: 'Ramesh Kumar (Demo)',
  role: 'worker',
  primaryPlatform: 'Zomato',
  city: 'Bengaluru',
  state: 'Karnataka',
  workType: 'delivery',
  preferredLanguage: 'en',
  onboarded: true,
  createdAt: '2026-10-01T08:30:00Z',
};

export function describeAuthError(error: AuthError): string {
  switch (error.code) {
    case 'invalid_credentials':
      return 'Incorrect email or password.';
    case 'email_not_confirmed':
      return 'Please confirm your email first. Check your inbox for the verification link.';
    case 'user_already_exists':
    case 'email_exists':
      return 'An account with this email already exists. Please log in instead.';
    case 'weak_password':
      return `Password is too weak. Use at least ${MIN_PASSWORD_LENGTH} characters with a mix of letters and numbers.`;
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Too many attempts. Please wait a minute and try again.';
    case 'same_password':
      return 'New password must be different from your current password.';
    default:
      return error.message || 'Something went wrong. Please try again.';
  }
}
