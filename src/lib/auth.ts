import { UserProfile } from '@/types';

const USERS_STORAGE_KEY = 'gigsaathi_users_v1';
const CURRENT_USER_KEY = 'gigsaathi_current_user_v1';

export const INITIAL_DEMO_USERS: UserProfile[] = [
  {
    id: 'user-admin-1',
    email: 'admin@gigsaathi.in',
    fullName: 'Admin Supervisor',
    phoneNumber: '+91 98765 00000',
    role: 'admin',
    primaryPlatform: 'GigSaathi Administration',
    city: 'New Delhi',
    preferredLanguage: 'en',
    createdAt: '2026-09-01T10:00:00Z',
  },
  {
    id: 'user-worker-1',
    email: 'ramesh.delivery@gmail.com',
    fullName: 'Ramesh Kumar',
    phoneNumber: '+91 98112 34567',
    role: 'worker',
    primaryPlatform: 'Zomato',
    city: 'Bengaluru (Indiranagar)',
    preferredLanguage: 'hi',
    createdAt: '2026-10-01T08:30:00Z',
  },
  {
    id: 'user-worker-2',
    email: 'gurpreet.cab@gmail.com',
    fullName: 'Gurpreet Singh',
    phoneNumber: '+91 98721 98765',
    role: 'worker',
    primaryPlatform: 'Uber',
    city: 'Amritsar / Delhi NCR',
    preferredLanguage: 'pa',
    createdAt: '2026-10-05T14:15:00Z',
  },
  {
    id: 'user-worker-3',
    email: 'suresh.blinkit@gmail.com',
    fullName: 'Suresh Patel',
    phoneNumber: '+91 97234 11223',
    role: 'worker',
    primaryPlatform: 'Blinkit',
    city: 'Ahmedabad',
    preferredLanguage: 'en',
    createdAt: '2026-10-10T11:00:00Z',
  }
];

export function getAllUsers(): UserProfile[] {
  if (typeof window === 'undefined') return INITIAL_DEMO_USERS;
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(INITIAL_DEMO_USERS));
      return INITIAL_DEMO_USERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_DEMO_USERS;
  }
}

export function getCurrentUser(): UserProfile | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    // Default logged in user for smooth demo experience
    const defaultUser = INITIAL_DEMO_USERS[1]; // Ramesh Kumar
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  } catch {
    return INITIAL_DEMO_USERS[1];
  }
}

export function setCurrentUser(user: UserProfile | null): void {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function registerUser(params: {
  email: string;
  fullName: string;
  phoneNumber?: string;
  role?: 'worker' | 'admin';
  primaryPlatform: string;
  city: string;
}): { success: boolean; user?: UserProfile; error?: string } {
  const users = getAllUsers();
  const existing = users.find((u) => u.email.toLowerCase() === params.email.toLowerCase().trim());
  if (existing) {
    return { success: false, error: 'A user with this email already exists. Please login instead.' };
  }

  const newUser: UserProfile = {
    id: 'user-' + Date.now(),
    email: params.email.trim(),
    fullName: params.fullName.trim(),
    phoneNumber: params.phoneNumber?.trim() || '',
    role: params.role || 'worker',
    primaryPlatform: params.primaryPlatform || 'Zomato',
    city: params.city || 'India',
    preferredLanguage: 'en',
    createdAt: new Date().toISOString(),
  };

  const updated = [...users, newUser];
  if (typeof window !== 'undefined') {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(updated));
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
  }
  return { success: true, user: newUser };
}

export function loginUser(email: string): { success: boolean; user?: UserProfile; error?: string } {
  const users = getAllUsers();
  const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!found) {
    return {
      success: false,
      error: 'No account found with this email. Try logging in as demo worker (ramesh.delivery@gmail.com) or demo admin (admin@gigsaathi.in), or sign up.',
    };
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(found));
  }
  return { success: true, user: found };
}

export function logoutUser(): void {
  setCurrentUser(null);
}
