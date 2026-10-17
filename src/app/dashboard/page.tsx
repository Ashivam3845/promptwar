'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { EarningsRecord } from '@/types';
import { getLocalEarningsRecords } from '@/lib/storage';
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
  ExternalLink,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const { t, language } = useLanguage();
  const [records, setRecords] = useState<EarningsRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = getLocalEarningsRecords();
    setRecords(data);
    setLoading(false);
  }, []);

  // Compute aggregate statistics
  const totalGross = records.reduce((acc, r) => acc + (r.grossEarnings || 0) + (r.incentives || 0), 0);
  const totalExpenses = records.reduce((acc, r) => acc + (r.totalExpenses || 0), 0);
  const totalDeductions = records.reduce((acc, r) => acc + (r.platformDeductions || 0), 0);
  const totalNet = records.reduce((acc, r) => acc + (r.netEarnings || 0), 0);
  const totalHours = records.reduce((acc, r) => acc + (r.hoursWorked || 0), 0);
  const avgHourlyRate = totalHours > 0 ? Math.round((totalNet / totalHours) * 100) / 100 : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner / Problem Statement */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#101c38] via-[#0e172a] to-[#0a1224] border border-slate-800 p-6 sm:p-8 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Companion for Delivery Partners, Drivers & Daily Earners</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            {t.dashboard.title}
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 leading-relaxed">
            {t.dashboard.subtitle}
          </p>
        </div>

        {/* Demo Mode Badge */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{t.common.demoMode} ({records.length} logged shifts loaded)</span>
          </div>
          <Link
            href="/tracker"
            className="text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
          >
            <span>{t.tracker.addNew}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net Take-Home */}
        <div className="col-span-2 sm:col-span-1 rounded-xl bg-[#0f172a] border border-emerald-500/30 p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>{t.dashboard.netIncome}</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-black text-emerald-400">
              ₹{totalNet.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Real in-hand after all costs
          </p>
        </div>

        {/* Gross Earned */}
        <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>{t.dashboard.grossEarnings}</span>
            <span className="text-[10px] text-slate-500 font-mono">APP DISPLAY</span>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-white">
              ₹{totalGross.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Base pay + incentives
          </p>
        </div>

        {/* Fuel & Expenses */}
        <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>{t.dashboard.expenses}</span>
            <Fuel className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-amber-400">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Fuel, food & bike upkeep
          </p>
        </div>

        {/* Deductions & Penalties */}
        <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-5 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider">
            <span>{t.dashboard.deductions}</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-rose-400">
              ₹{totalDeductions.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Platform cuts & penalties
          </p>
        </div>
      </div>

      {/* Hourly Take-Home Highlight Banner */}
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
              Based on {totalHours} logged work hours across {records.length} shifts.
            </p>
          </div>
        </div>
        <Link
          href="/tracker"
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 self-end sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.dashboard.logEarnings}</span>
        </Link>
      </div>

      {/* Primary Workflow Shortcuts */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <span>{t.dashboard.quickShortcuts}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Ask AI */}
          <Link
            href="/assistant"
            className="group p-5 rounded-xl bg-[#0f172a] hover:bg-[#131f38] border border-slate-800 hover:border-emerald-500/40 transition-all shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                {t.dashboard.askAI}
              </h4>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Check whether platform deductions are unfair, query accident claims, and get answers in Hindi or Punjabi.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-emerald-400 gap-1 group-hover:translate-x-1 transition-transform">
              <span>Open Chat</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Draft Complaint */}
          <Link
            href="/complaints"
            className="group p-5 rounded-xl bg-[#0f172a] hover:bg-[#131f38] border border-slate-800 hover:border-emerald-500/40 transition-all shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors">
                {t.dashboard.generateComplaint}
              </h4>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Generate formal, ready-to-copy grievance letters citing Natural Justice and Consumer Protection norms.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-teal-400 gap-1 group-hover:translate-x-1 transition-transform">
              <span>Draft Letter</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* Welfare Schemes */}
          <Link
            href="/schemes"
            className="group p-5 rounded-xl bg-[#0f172a] hover:bg-[#131f38] border border-slate-800 hover:border-emerald-500/40 transition-all shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                {t.dashboard.exploreSchemes}
              </h4>
              <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                Explore e-Shram, PM-JAY, Rajasthan Gig Board, and Delhi Motor Vehicle rules with direct official portal links.
              </p>
            </div>
            <div className="mt-4 flex items-center text-xs font-semibold text-blue-400 gap-1 group-hover:translate-x-1 transition-transform">
              <span>View Schemes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity Table / Card List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">
            {t.dashboard.recentActivity}
          </h3>
          <Link
            href="/tracker"
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {records.length === 0 ? (
          <div className="rounded-xl bg-[#0f172a] border border-slate-800 p-8 text-center text-slate-400">
            <p className="text-sm">{t.dashboard.noEntries}</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#0f172a] shadow-lg">
            <div className="divide-y divide-slate-800/80">
              {records.slice(0, 4).map((record) => (
                <div
                  key={record.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                      {record.platform}
                    </span>
                    <div>
                      <h5 className="text-sm font-semibold text-slate-100">
                        {record.description || 'Shift work'}
                      </h5>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>{record.workDate}</span>
                        <span>•</span>
                        <span>{record.hoursWorked} hrs worked</span>
                        {record.effectiveHourlyRate && (
                          <>
                            <span>•</span>
                            <span className="text-emerald-400">
                              ₹{record.effectiveHourlyRate}/hr
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-0 border-slate-800/80 pt-2 sm:pt-0">
                    <span className="text-sm font-extrabold text-emerald-400">
                      ₹{record.netEarnings.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Gross: ₹{(record.grossEarnings + record.incentives).toLocaleString('en-IN')} | Exp: ₹{record.totalExpenses + record.platformDeductions}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
