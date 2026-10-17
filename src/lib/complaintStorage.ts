import { ComplaintDraft } from '@/types';

// Demo-mode only, like lib/storage.ts. Signed-in users' drafts are stored in Supabase.
const COMPLAINTS_STORAGE_KEY = 'gigsaathi_demo_complaints_v1';

export const INITIAL_DEMO_COMPLAINTS: ComplaintDraft[] = [
  {
    id: 'draft-demo-1',
    title: 'Disputed Heavy Rain Delay Penalty - Zomato',
    platformOrEmployer: 'Zomato India',
    incidentDate: '2026-10-12',
    amountDisputed: 500,
    recipientCategory: 'Company Grievance Cell',
    subject: 'Formal Request for Immediate Reversal of Unfair ₹500 Delivery Penalty during Severe Weather Conditions (Order ID: #ZOM-9921)',
    formalLetter: `To,
The Grievance Redressal Officer / Partner Support Lead,
Zomato Media Private Limited.

Subject: Formal Request for Immediate Reversal of Unfair ₹500 Delivery Penalty during Severe Weather Conditions (Order ID: #ZOM-9921)

Respected Sir/Madam,

I am writing this formal grievance representation regarding an unjust deduction of ₹500 imposed on my partner earnings on 12th October 2026.

1. Summary of Facts:
On the date mentioned above, at approximately 20:15 IST, I was dispatched to pick up order #ZOM-9921. At that exact time, the city experienced heavy torrential rainfall and severe road waterlogging. Despite prioritizing customer order safety and navigating flooded transit corridors on a two-wheeler, the delivery was delayed by 18 minutes due to acts of God and weather beyond human control.

2. Violation of Natural Justice and Platform Safety Norms:
Penalizing delivery executives for weather-induced delays directly endangers rider road safety and forces hazardous driving under wet road conditions. Furthermore, deducting half of a worker's daily wage without prior human review or opportunity for explanation violates the principles of natural justice and fair platform trade practices.

3. Specific Demands:
a) Immediate refund/credit of the wrongly withheld ₹500 into my partner payout account within 3 business days.
b) Removal of any adverse acceptance/delay mark from my partner reliability score.

Attached please find geo-location timestamps, in-app chat communications, and photographic evidence of flooded road conditions.

Yours sincerely,
A. Kumar (Partner ID: ZOM-BLR-4482)`,
    factsSummary: [
      'Order delayed by 18 minutes due to severe urban waterlogging and heavy downpour',
      'Rider informed customer and partner support in real-time via in-app chat',
      'Penalty of ₹500 deducted automatically without human hearing or review'
    ],
    legalFairnessBasis: [
      'Doctrine of Force Majeure (severe weather beyond reasonable control)',
      'Right to safe working conditions (National Policy on Road Safety & State Motor Vehicle Guidelines)',
      'Protection against unfair trade practices under Consumer Protection Act & National Consumer Helpline standards'
    ],
    requestedRelief: [
      'Full refund/reversal of ₹500 deducted amount',
      'Restoration of partner reliability score to 100%'
    ],
    supportingEvidence: [
      'Screenshot of in-app payout deduction notice showing ₹500 cut',
      'In-app chat transcripts with customer acknowledging weather delays',
      'Official weather report / IMD rainfall advisory for 12 Oct 2026'
    ],
    language: 'en',
    status: 'draft',
    createdAt: new Date('2026-10-14T10:00:00Z').toISOString(),
  }
];

export function getLocalComplaints(): ComplaintDraft[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_COMPLAINTS;
  try {
    const raw = localStorage.getItem(COMPLAINTS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_COMPLAINTS));
      return INITIAL_DEMO_COMPLAINTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_COMPLAINTS;
  }
}

export function saveLocalComplaint(draft: Omit<ComplaintDraft, 'id' | 'createdAt'> & { id?: string }): ComplaintDraft {
  const current = getLocalComplaints();
  const now = new Date().toISOString();

  if (draft.id) {
    const index = current.findIndex((c) => c.id === draft.id);
    if (index >= 0) {
      const updated: ComplaintDraft = {
        ...current[index],
        ...draft,
        status: 'saved',
      };
      current[index] = updated;
      if (typeof window !== 'undefined') {
        localStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(current));
      }
      return updated;
    }
  }

  const newDraft: ComplaintDraft = {
    ...draft,
    id: 'complaint-' + Date.now(),
    status: 'saved',
    createdAt: now,
  };

  const updated = [newDraft, ...current];
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(updated));
  }
  return newDraft;
}

export function deleteLocalComplaint(id: string): void {
  const current = getLocalComplaints();
  const filtered = current.filter((c) => c.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(filtered));
  }
}

export function resetDemoComplaints(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(COMPLAINTS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_COMPLAINTS));
  }
}
