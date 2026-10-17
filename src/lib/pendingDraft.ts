import { ComplaintDraft } from '@/types';

// A guest's generated complaint, kept on this device while they sign up or log in,
// then restored on /complaints so they can save it to their new account.
// localStorage (not sessionStorage) because the email confirmation link opens a new tab.
const PENDING_DRAFT_KEY = 'gigsaathi_pending_complaint';

export function stashPendingDraft(draft: ComplaintDraft): void {
  try {
    localStorage.setItem(PENDING_DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage unavailable: the guest will need to regenerate after signing in.
  }
}

export function hasPendingDraft(): boolean {
  try {
    return localStorage.getItem(PENDING_DRAFT_KEY) !== null;
  } catch {
    return false;
  }
}

export function takePendingDraft(): ComplaintDraft | null {
  try {
    const raw = localStorage.getItem(PENDING_DRAFT_KEY);
    localStorage.removeItem(PENDING_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as ComplaintDraft) : null;
  } catch {
    return null;
  }
}
