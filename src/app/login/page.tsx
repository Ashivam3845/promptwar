'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth';
import { PasswordInput } from '@/components/PasswordInput';
import {
  LogIn,
  UserPlus,
  User,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
  MailCheck,
  LoaderCircle,
} from 'lucide-react';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only follow same-site relative paths from ?next= to avoid open redirects.
function safeNextPath(next: string | null) {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [primaryPlatform, setPrimaryPlatform] = useState('Zomato');
  const [city, setCity] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    searchParams.get('error') === 'link_invalid'
      ? 'That link is invalid or has expired. Please log in or request a new link.'
      : null
  );
  const [confirmationSentTo, setConfirmationSentTo] = useState<string | null>(null);

  const switchMode = (next: 'login' | 'signup') => {
    setMode(next);
    setError(null);
    setPassword('');
    setConfirmPassword('');
  };

  const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    const res = await login(email, password);
    if (res.success) {
      router.replace(safeNextPath(searchParams.get('next')));
      router.refresh();
    } else {
      setSubmitting(false);
      setError(res.error || 'Login failed.');
    }
  };

  const handleRegister = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const res = await register({ email, password, fullName, phoneNumber, primaryPlatform, city });
    setSubmitting(false);

    if (!res.success) {
      setError(res.error || 'Registration failed.');
    } else if (res.needsConfirmation) {
      setConfirmationSentTo(email.trim());
    } else {
      router.replace('/');
      router.refresh();
    }
  };

  if (confirmationSentTo) {
    return (
      <div className="max-w-md mx-auto pt-4 animate-fadeIn">
        <div className="bg-[#0f172a] border border-emerald-500/30 rounded-2xl p-6 shadow-xl space-y-4 text-center">
          <MailCheck className="w-10 h-10 text-emerald-400 mx-auto" />
          <h1 className="text-lg font-bold text-white">Check your email</h1>
          <p className="text-xs text-slate-300">
            We sent a verification link to <span className="font-bold text-white">{confirmationSentTo}</span>.
            Click it to activate your account. You will be signed in automatically.
          </p>
          <button
            onClick={() => {
              setConfirmationSentTo(null);
              switchMode('login');
            }}
            className="text-xs font-bold text-emerald-400 hover:underline"
          >
            Back to Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4 animate-fadeIn">
      <div className="text-center space-y-1">
        <h1 className="text-2xl font-extrabold text-white">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="text-xs text-slate-400">
          {mode === 'login'
            ? 'Log in to track earnings, check schemes, and file grievances.'
            : 'Join GigSaathi AI. It is free for every gig worker.'}
        </p>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        {/* Toggle Mode */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            type="button"
            onClick={() => switchMode('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'signup'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs rounded-xl pl-9 pr-3 py-2.5 text-white outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="login-password" className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <Link href="/forgot-password" className="text-[11px] font-semibold text-emerald-400 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="login-password"
                value={password}
                onChange={setPassword}
                placeholder="Your password"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              {submitting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
              <span>{submitting ? 'Signing in…' : 'Sign In to GigSaathi'}</span>
            </button>

            {/* Quick-fill verified Supabase credentials */}
            <div className="pt-2 border-t border-slate-800">
              <span className="block text-[11px] font-semibold text-slate-400 mb-2">
                Live Supabase Accounts (Click to test):
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('worker@gigsaathi.in');
                    setPassword('Worker@12345');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-emerald-500/50 text-[11px] text-slate-300 text-left transition-colors"
                >
                  <span className="block font-bold text-emerald-400">Worker Account</span>
                  <span className="block text-[10px] text-slate-500 truncate">worker@gigsaathi.in</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('admin@gigsaathi.in');
                    setPassword('Admin@12345');
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-rose-500/50 text-[11px] text-slate-300 text-left transition-colors"
                >
                  <span className="block font-bold text-rose-400">Admin Supervisor</span>
                  <span className="block text-[10px] text-slate-500 truncate">admin@gigsaathi.in</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5" noValidate>
            <div>
              <label htmlFor="signup-name" className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  id="signup-name"
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  autoComplete="name"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs rounded-xl pl-9 pr-3 py-2.5 text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-email" className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs rounded-xl pl-9 pr-3 py-2.5 text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="signup-password" className="block text-xs font-semibold text-slate-300 mb-1">
                Password * <span className="text-slate-500 font-normal">(min. {MIN_PASSWORD_LENGTH} characters)</span>
              </label>
              <PasswordInput
                id="signup-password"
                value={password}
                onChange={setPassword}
                placeholder="Create a password"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="signup-confirm" className="block text-xs font-semibold text-slate-300 mb-1">
                Confirm Password *
              </label>
              <PasswordInput
                id="signup-confirm"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label htmlFor="signup-phone" className="block text-xs font-semibold text-slate-300 mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  id="signup-phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+91 98XXX XXXXX"
                  autoComplete="tel"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs rounded-xl pl-9 pr-3 py-2.5 text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="signup-platform" className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary Platform
                </label>
                <select
                  id="signup-platform"
                  value={primaryPlatform}
                  onChange={(e) => setPrimaryPlatform(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs rounded-xl px-3 py-2.5 text-white outline-none"
                >
                  <option value="Zomato">Zomato</option>
                  <option value="Swiggy">Swiggy</option>
                  <option value="Uber">Uber</option>
                  <option value="Ola">Ola</option>
                  <option value="Blinkit">Blinkit</option>
                  <option value="Zepto">Zepto</option>
                  <option value="Daily Wage">Daily Wage</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label htmlFor="signup-city" className="block text-xs font-semibold text-slate-300 mb-1">
                  City / Region
                </label>
                <input
                  id="signup-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Delhi"
                  autoComplete="address-level2"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs rounded-xl px-3 py-2.5 text-white outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              {submitting ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              <span>{submitting ? 'Creating account…' : 'Create Account'}</span>
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-[11px] text-slate-500 flex items-center justify-center gap-1">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span>Secured by Supabase Auth. Your password is never stored in this app.</span>
      </p>
    </div>
  );
}
