'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  LogIn,
  UserPlus,
  ShieldCheck,
  User,
  Mail,
  MapPin,
  Bike,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, register, logout, switchUser } = useAuth();
  const { t } = useLanguage();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [primaryPlatform, setPrimaryPlatform] = useState('Zomato');
  const [city, setCity] = useState('Bengaluru');
  const [role, setRole] = useState<'worker' | 'admin'>('worker');

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    const res = login(email);
    if (res.success) {
      setSuccessMsg('Logged in successfully!');
      setTimeout(() => router.push('/'), 1000);
    } else {
      setError(res.error || 'Login failed.');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !fullName.trim()) {
      setError('Full name and email are required.');
      return;
    }

    const res = register({
      email,
      fullName,
      phoneNumber,
      role,
      primaryPlatform,
      city,
    });

    if (res.success) {
      setSuccessMsg(`Welcome to GigSaathi AI, ${fullName}! Account created.`);
      setTimeout(() => router.push(role === 'admin' ? '/admin' : '/'), 1200);
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4 animate-fadeIn">
      {/* Current Active User Banner if logged in */}
      {user && (
        <div className="bg-[#0f172a] border border-emerald-500/30 rounded-2xl p-5 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
              Active Session
            </span>
            <span
              className={`text-[10px] font-extrabold px-2 py-0.5 rounded uppercase ${
                user.role === 'admin'
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              {user.role}
            </span>
          </div>

          <div>
            <h3 className="text-lg font-bold text-white">{user.fullName}</h3>
            <p className="text-xs text-slate-400">{user.email}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {user.primaryPlatform} • {user.city}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-800">
            {user.role === 'admin' ? (
              <button
                onClick={() => router.push('/admin')}
                className="text-xs font-bold text-rose-400 hover:underline flex items-center gap-1"
              >
                <span>Go to Admin Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => router.push('/')}
                className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Go to Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={logout}
              className="text-xs font-semibold text-slate-400 hover:text-rose-400"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}

      {/* Quick Demo Switcher Cards */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
          One-Click Demo Personas:
        </span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              switchUser('worker');
              setSuccessMsg('Switched to Demo Worker (Ramesh Kumar)');
              setTimeout(() => router.push('/'), 800);
            }}
            className="p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-emerald-500/40 text-left transition-all group"
          >
            <div className="text-xs font-bold text-white group-hover:text-emerald-400 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Gig Worker</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Ramesh Kumar (Zomato)
            </div>
          </button>

          <button
            onClick={() => {
              switchUser('admin');
              setSuccessMsg('Switched to Demo Admin Supervisor');
              setTimeout(() => router.push('/admin'), 800);
            }}
            className="p-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-rose-500/40 text-left transition-all group"
          >
            <div className="text-xs font-bold text-white group-hover:text-rose-400 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Supervisor</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Admin (View all workers)
            </div>
          </button>
        </div>
      </div>

      {/* Main Login / Signup Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        {/* Toggle Mode */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => {
              setMode('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => {
              setMode('signup');
              setError(null);
            }}
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
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. ramesh.delivery@gmail.com or admin@gigsaathi.in"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs rounded-xl pl-9 pr-3 py-2.5 text-white outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In to GigSaathi</span>
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Full Name *
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs rounded-xl pl-9 pr-3 py-2 text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Email Address *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul.delivery@gmail.com"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs rounded-xl pl-9 pr-3 py-2 text-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Primary Platform
                </label>
                <select
                  value={primaryPlatform}
                  onChange={(e) => setPrimaryPlatform(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs rounded-xl px-3 py-2 text-white outline-none"
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
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  City / Region
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Delhi, Mumbai"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Account Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('worker')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                    role === 'worker'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Gig Worker
                </button>
                <button
                  type="button"
                  onClick={() => setRole('admin')}
                  className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all ${
                    role === 'admin'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-400 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  Admin / NGO
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
