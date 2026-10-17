'use client';

import React from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { SupportedLanguage } from '@/types';
import {
  Wallet,
  Languages,
  ShieldCheck,
  FileText,
  ArrowRight,
  PlayCircle,
  Bot,
  Lock,
  Sparkles,
} from 'lucide-react';

const LANGUAGE_OPTIONS: { code: SupportedLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

const FEATURE_ICONS = [Wallet, Languages, ShieldCheck, FileText];

export default function LandingPage() {
  const { t, language, setLanguage } = useLanguage();
  const { startDemo } = useAuth();
  const l = t.landing;

  return (
    <div className="space-y-12 animate-fadeIn">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#101c38] via-[#0e172a] to-[#0a1224] border border-slate-800 p-6 sm:p-10 shadow-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{l.badge}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {l.headline}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">{l.subhead}</p>

          {/* Language first: everything below switches immediately */}
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t.common.language}>
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                role="radio"
                aria-checked={language === opt.code}
                onClick={() => setLanguage(opt.code)}
                className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${
                  language === opt.code
                    ? 'bg-emerald-500 border-emerald-500 text-slate-950'
                    : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link
              href="/login?mode=signup"
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
            >
              <span>{l.getStarted}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <button
              type="button"
              onClick={startDemo}
              className="px-6 py-3 rounded-xl border border-slate-700 bg-slate-900/80 hover:bg-slate-800 text-white font-bold text-sm transition-all flex items-center justify-center gap-2"
            >
              <PlayCircle className="w-4 h-4 text-emerald-400" />
              <span>{l.tryDemo}</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
            <Link href="/assistant" className="inline-flex items-center gap-1.5 font-semibold text-emerald-400 hover:underline">
              <Bot className="w-4 h-4" />
              <span>{l.askNow}</span>
            </Link>
            <span className="text-slate-400">
              {l.haveAccount}{' '}
              <Link href="/login" className="font-semibold text-white hover:underline">
                {l.logIn}
              </Link>
            </span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">{l.featuresTitle}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {l.features.map((f, i) => {
            const Icon = FEATURE_ICONS[i];
            return (
              <div key={f.title} className="p-5 rounded-xl bg-[#0f172a] border border-slate-800 shadow-md">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">{f.title}</h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">{f.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white">{l.stepsTitle}</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {l.steps.map((step, i) => (
            <li key={step} className="flex items-center gap-3 p-4 rounded-xl bg-[#0f172a] border border-slate-800">
              <span className="w-8 h-8 shrink-0 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-sm font-black flex items-center justify-center">
                {i + 1}
              </span>
              <span className="text-xs font-semibold text-slate-200">{step}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5" />
          <span>{l.privacy}</span>
        </p>
      </section>
    </div>
  );
}
