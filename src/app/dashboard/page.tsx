'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { fill } from '@/lib/i18n-journey';
import { summarizeEarnings } from '@/lib/calculations';
import { ComplaintDraft, EarningsRecord } from '@/types';
import {
  TrendingUp,
  Fuel,
  AlertTriangle,
  Clock,
  ArrowRight,
  Bot,
  FileText,
  ShieldCheck,
  PlusCircle,
  ChevronRight,
  Sparkles,
  Wallet,
  Mic,
  UserCog,
  AlertCircle,
  LoaderCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const { t } = useLanguage();
  const { store, profile, mode } = useAuth();
  const j = t.journey;

  const [records, setRecords] = useState<EarningsRecord[]>([]);
  const [complaints, setComplaints] = useState<ComplaintDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!store) return;
    setLoading(true);
    setError(null);
    try {
      const [earnings, drafts] = await Promise.all([store.listEarnings(), store.listComplaints()]);
      setRecords(earnings);
      setComplaints(drafts);
    } catch (err) {
      setError(err instanceof Error ? err.message : j.loadError);
    } finally {
      setLoading(false);
    }
  }, [store, j.loadError]);

  useEffect(() => {
    // Data is fetched from the visitor's own store (Supabase or demo), so this runs after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const firstName = profile?.fullName.split(' ')[0] ?? '';
  const isNewUser = !loading && !error && records.length === 0;

  const { totalGross, totalExpenses, totalDeductions, totalNet, totalHours, avgHourlyRate } = useMemo(
    () => summarizeEarnings(records),
    [records]
  );

  const goals = [
    { key: 'deduction', href: '/complaints', icon: FileText, color: 'text-rose-400 bg-rose-500/10' },
    { key: 'earnings', href: '/tracker', icon: Wallet, color: 'text-emerald-400 bg-emerald-500/10' },
    { key: 'schemes', href: '/schemes', icon: ShieldCheck, color: 'text-blue-400 bg-blue-500/10' },
    { key: 'voice', href: '/assistant', icon: Mic, color: 'text-amber-400 bg-amber-500/10' },
  ] as const;

  if (mode === 'loading' || (loading && !error)) {
    return (
      <div className="flex justify-center py-16">
        <LoaderCircle className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#101c38] via-[#0e172a] to-[#0a1224] border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t.dashboard.title}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {fill(isNewUser ? j.welcomeNew : j.welcomeBack, { name: firstName })}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            {isNewUser ? j.newUserBody : t.dashboard.subtitle}
          </p>
          {isNewUser && (
            <Link
              href="/tracker?add=1"
              className="inline-flex px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-sm font-bold rounded-xl transition-colors items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{j.logFirstShift}</span>
            </Link>
          )}
        </div>
      </div>

      {mode === 'user' && profile && !profile.onboarded && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-amber-200 flex items-center gap-2">
            <UserCog className="w-4 h-4 shrink-0" />
            <span>{j.completeProfile}</span>
          </p>
          <Link href="/onboarding" className="text-xs font-bold text-amber-300 hover:underline shrink-0">
            {j.completeProfileCta}
          </Link>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{j.loadError} {error}</span>
          </p>
          <button onClick={load} className="text-xs font-bold text-rose-300 hover:underline shrink-0">
            {j.retry}
          </button>
        </div>
      )}

      {/* Earnings overview: only from the user's own recorded shifts */}
      {records.length > 0 && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="col-span-2 sm:col-span-1 rounded-xl bg-[#0f172a] border border-emerald-500/30 p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>{t.dashboard.netIncome}</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="mt-3 text-3xl font-black text-emerald-400">₹{totalNet.toLocaleString('en-IN')}</div>
            </div>
            <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-5 shadow-lg">
              <div className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{t.dashboard.grossEarnings}</div>
              <div className="mt-3 text-2xl font-bold text-white">₹{totalGross.toLocaleString('en-IN')}</div>
            </div>
            <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>{t.dashboard.expenses}</span>
                <Fuel className="w-4 h-4 text-amber-400" />
              </div>
              <div className="mt-3 text-2xl font-bold text-amber-400">₹{totalExpenses.toLocaleString('en-IN')}</div>
            </div>
            <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-5 shadow-lg">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
                <span>{t.dashboard.deductions}</span>
                <AlertTriangle className="w-4 h-4 text-rose-400" />
              </div>
              <div className="mt-3 text-2xl font-bold text-rose-400">₹{totalDeductions.toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">
                  {t.dashboard.hourlyRate}: <span className="text-emerald-400 text-lg font-bold">₹{avgHourlyRate}{t.dashboard.perHour}</span>
                </h4>
                <p className="text-xs text-slate-400">
                  {totalHours} hrs · {records.length} shifts
                </p>
              </div>
            </div>
            <Link
              href="/tracker?add=1"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 self-end sm:self-auto"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{t.dashboard.logEarnings}</span>
            </Link>
          </div>
        </>
      )}

      {/* Goal chooser: start with whichever problem matters most */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white">{j.goalTitle}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map((g) => {
            const Icon = g.icon;
            const copy = j.goals[g.key];
            return (
              <Link
                key={g.key}
                href={g.href}
                className="group p-4 rounded-xl bg-[#0f172a] hover:bg-[#131f38] border border-slate-800 hover:border-emerald-500/40 transition-all flex items-start gap-3"
              >
                <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${g.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{copy.title}</h4>
                  <p className="mt-0.5 text-xs text-slate-400">{copy.body}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 mt-1" />
              </Link>
            );
          })}
        </div>
      </div>

      {records.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">{t.dashboard.recentActivity}</h3>
            <Link href="/tracker" className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1">
              <span>{t.common.all}</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a] shadow-lg divide-y divide-slate-800/80">
            {records.slice(0, 4).map((record) => (
              <div key={record.id} className="p-4 flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700 shrink-0">
                    {record.platform}
                  </span>
                  <div className="min-w-0">
                    <h5 className="text-sm font-semibold text-slate-100 truncate">{record.description || record.platform}</h5>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {record.workDate} · {record.hoursWorked} hrs
                    </p>
                  </div>
                </div>
                <span className="text-sm font-extrabold text-emerald-400 shrink-0">₹{record.netEarnings.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Saved complaints: reopen and keep working on them */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white">{j.savedComplaints}</h3>
        {complaints.length === 0 ? (
          <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-5 text-xs text-slate-400">{j.noSavedComplaints}</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a] divide-y divide-slate-800/80">
            {complaints.slice(0, 3).map((c) => (
              <Link key={c.id} href={`/complaints?draft=${c.id}`} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-800/40">
                <div className="min-w-0">
                  <h5 className="text-sm font-semibold text-slate-100 truncate">{c.title}</h5>
                  <p className="text-xs text-slate-400 mt-0.5">{c.platformOrEmployer} · {c.incidentDate}</p>
                </div>
                <span className="text-xs font-bold text-emerald-400 shrink-0">{j.openDraft}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <Link href="/assistant" className="flex items-center justify-center gap-2 text-xs font-semibold text-emerald-400 hover:underline">
        <Bot className="w-4 h-4" />
        <span>{t.dashboard.askAI}</span>
      </Link>
    </div>
  );
}
