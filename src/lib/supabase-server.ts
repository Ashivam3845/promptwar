import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { supabaseUrl, supabaseAnonKey } from './supabase';

// Server-side client for route handlers. Reads and refreshes the auth session cookies.
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}
