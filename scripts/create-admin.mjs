// Creates (or promotes) the default admin account in Supabase Auth.
// Usage: npm run create-admin
// Reads from .env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD.
// Safe to re-run: an existing account with ADMIN_EMAIL is promoted to admin, not duplicated.

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;

const missing = Object.entries({
  NEXT_PUBLIC_SUPABASE_URL: url,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  ADMIN_EMAIL: email,
  ADMIN_PASSWORD: password,
})
  .filter(([, v]) => !v)
  .map(([k]) => k);

if (missing.length) {
  console.error(`Missing in .env: ${missing.join(', ')}`);
  process.exit(1);
}
if (password.length < 8) {
  console.error('ADMIN_PASSWORD must be at least 8 characters.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function findUserByEmail(target) {
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found || data.users.length < 1000) return found ?? null;
  }
}

try {
  const existing = await findUserByEmail(email);

  if (existing) {
    const { error } = await supabase.auth.admin.updateUserById(existing.id, {
      app_metadata: { ...existing.app_metadata, role: 'admin' },
      email_confirm: true,
    });
    if (error) throw error;
    console.log(`Existing user ${email} now has the admin role. Password unchanged.`);
  } else {
    const { error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: 'admin' },
      user_metadata: {
        full_name: 'Admin Supervisor',
        primary_platform: 'GigSaathi Administration',
        city: 'New Delhi',
        preferred_language: 'en',
      },
    });
    if (error) throw error;
    console.log(`Admin user ${email} created. Log in at /login with ADMIN_EMAIL / ADMIN_PASSWORD.`);
  }
} catch (err) {
  console.error('Failed to create admin user:', err.message ?? err);
  process.exit(1);
}
