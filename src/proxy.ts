import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } from '@/lib/supabase';
import { DEMO_COOKIE } from '@/lib/demo';

// Access levels (progressive onboarding):
// - Public: anyone can get help right away (Ask AI, schemes, drafting a complaint).
// - Workspace: needs an account or demo mode, because it shows personal records.
// - Account: needs a real signed-in user.
const WORKSPACE_PATHS = ['/dashboard', '/tracker', '/settings'];
const ACCOUNT_PATHS = ['/onboarding', '/reset-password', '/admin'];
// Signed-in users skip these and go straight to their dashboard.
const GUEST_ONLY_PATHS = ['/login', '/forgot-password'];

// Anonymous visitors can use the AI endpoints, within a per-IP budget, so a first-time
// worker gets help without signing up but the paid APIs cannot be drained.
// In-memory and per server instance: enough for an MVP, use a shared store (e.g. Redis) at scale.
const ANON_API_LIMIT = 20;
const ANON_API_WINDOW_MS = 10 * 60 * 1000;
const anonApiHits = new Map<string, { count: number; resetAt: number }>();

function matches(pathname: string, paths: string[]) {
  return paths.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isAnonRateLimited(request: NextRequest): boolean {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || request.headers.get('x-real-ip') || 'local';
  const now = Date.now();
  const entry = anonApiHits.get(ip);
  if (!entry || entry.resetAt <= now) {
    anonApiHits.set(ip, { count: 1, resetAt: now + ANON_API_WINDOW_MS });
    if (anonApiHits.size > 10_000) {
      for (const [key, value] of anonApiHits) if (value.resetAt <= now) anonApiHits.delete(key);
    }
    return false;
  }
  entry.count += 1;
  return entry.count > ANON_API_LIMIT;
}

// Supabase stores the session in cookies named sb-<project-ref>-auth-token (possibly chunked).
function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.getAll().some((c) => c.name.startsWith('sb-') && c.name.includes('-auth-token'));
}

function redirectTo(request: NextRequest, pathname: string, next?: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = '';
  if (next) url.searchParams.set('next', next);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  let isAuthenticated = false;

  // Anonymous visitors have no session to verify or refresh: skip the Supabase call entirely.
  if (hasSessionCookie(request)) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    });

    // Validates the JWT and refreshes an expiring session (writes new cookies via setAll).
    const { data } = await supabase.auth.getClaims();
    isAuthenticated = Boolean(data?.claims);
  }

  const isDemo = request.cookies.get(DEMO_COOKIE)?.value === '1';
  const { pathname, search } = request.nextUrl;

  if (pathname.startsWith('/api/')) {
    if (!isAuthenticated && request.method !== 'GET' && isAnonRateLimited(request)) {
      return NextResponse.json(
        { error: 'You have reached the free limit for guests. Please sign up or log in to keep going.' },
        { status: 429 }
      );
    }
    return response;
  }

  if (isAuthenticated && (pathname === '/' || matches(pathname, GUEST_ONLY_PATHS))) {
    return redirectTo(request, '/dashboard');
  }

  if (!isAuthenticated && matches(pathname, ACCOUNT_PATHS)) {
    return redirectTo(request, '/login', pathname + search);
  }

  if (!isAuthenticated && !isDemo && matches(pathname, WORKSPACE_PATHS)) {
    return redirectTo(request, '/login', pathname + search);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
