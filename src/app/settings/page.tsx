'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { resetDemoEarningsRecords } from '@/lib/storage';
import { SupportedLanguage } from '@/types';
import {
  Settings,
  Languages,
  User,
  Shield,
  RotateCcw,
  CheckCircle2,
  Database,
  ExternalLink,
  Sun,
  Moon,
} from 'lucide-react';

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [workerName, setWorkerName] = useState('Ramesh Kumar (Partner)');
  const [primaryPlatform, setPrimaryPlatform] = useState('Zomato');
  const [city, setCity] = useState('Bengaluru (Indiranagar Zone)');
  const [resetDone, setResetDone] = useState(false);

  const handleResetData = () => {
    if (confirm('Are you sure you want to restore the default sample shifts?')) {
      resetDemoEarningsRecords();
      setResetDone(true);
      setTimeout(() => setResetDone(false), 3000);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-7 h-7 text-emerald-400" />
          <span>{t.settings.title}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {t.settings.subtitle}
        </p>
      </div>

      {resetDone && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Default demonstration data restored.</span>
        </div>
      )}

      {/* Outdoor & Sunlight Display Mode Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sun className="w-5 h-5 text-amber-400" />
          <span>Display Mode & Outdoor Visibility</span>
        </h2>
        <p className="text-xs text-slate-400">
          Designed specifically for delivery riders and field workers operating under direct harsh sunlight or during night shifts.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <button
            onClick={() => setTheme('light')}
            className={`p-4 rounded-xl border text-left transition-all ${
              theme === 'light'
                ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" />
              <div className="font-bold text-sm">Sunlight / Day Mode</div>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Ultra-high contrast, crisp dark text on clean white cards for outdoor sunlight legibility on bikes.
            </div>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`p-4 rounded-xl border text-left transition-all ${
              theme === 'dark'
                ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-emerald-400" />
              <div className="font-bold text-sm">Dark Navy Mode</div>
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              Low glare, battery saving for evening dinner rush and night deliveries.
            </div>
          </button>
        </div>
      </div>

      {/* Language Preferences Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Languages className="w-5 h-5 text-emerald-400" />
          <span>{t.settings.preferredLanguage}</span>
        </h2>
        <p className="text-xs text-slate-400">
          Select your primary interface language. AI responses, menus, and summaries will automatically adapt.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <button
            onClick={() => setLanguage('en')}
            className={`p-4 rounded-xl border text-left transition-all ${
              language === 'en'
                ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-sm">English</div>
            <div className="text-[11px] text-slate-400 mt-1">Default international format</div>
          </button>

          <button
            onClick={() => setLanguage('hi')}
            className={`p-4 rounded-xl border text-left transition-all ${
              language === 'hi'
                ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-sm">हिन्दी (Hindi)</div>
            <div className="text-[11px] text-slate-400 mt-1">सरल हिंदी भाषा</div>
          </button>

          <button
            onClick={() => setLanguage('pa')}
            className={`p-4 rounded-xl border text-left transition-all ${
              language === 'pa'
                ? 'bg-emerald-500/10 border-emerald-500 text-white shadow-md'
                : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="font-bold text-sm">ਪੰਜਾਬੀ (Punjabi)</div>
            <div className="text-[11px] text-slate-400 mt-1">ਗੁਰਮੁਖੀ ਅੱਖਰ</div>
          </button>
        </div>
      </div>

      {/* Profile Card */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-400" />
          <span>{t.settings.profileInfo}</span>
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.settings.workerName}
            </label>
            <input
              type="text"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.settings.primaryPlatform}
              </label>
              <input
                type="text"
                value={primaryPlatform}
                onChange={(e) => setPrimaryPlatform(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.settings.city}
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Supabase & Cloud Storage Status */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          <span>Cloud Database & Persistence Status</span>
        </h2>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="font-semibold text-slate-200">Storage Backend:</span>
            <span className="ml-2 text-emerald-400 font-bold">Local Demo Storage + Supabase Adapter Ready</span>
          </div>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
            Offline Resilient
          </span>
        </div>
        <p className="text-xs text-slate-400">
          The app functions 100% offline or standalone using browser-level verified demo storage, and provides ready-to-run Supabase PostgreSQL schema migrations in <code className="bg-slate-900 px-1 py-0.5 rounded text-slate-300">/supabase/migrations</code>.
        </p>
      </div>

      {/* Data Management & Privacy */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <span>{t.settings.dataManagement}</span>
        </h2>

        <p className="text-xs text-slate-300 leading-relaxed">
          {t.settings.privacyStatement}
        </p>

        <div className="pt-2 flex items-center justify-between border-t border-slate-800/80">
          <div>
            <span className="text-xs font-semibold text-white block">
              {t.settings.clearLocalData}
            </span>
            <span className="text-[11px] text-slate-400">
              {t.settings.clearNotice}
            </span>
          </div>

          <button
            onClick={handleResetData}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Demo</span>
          </button>
        </div>
      </div>
    </div>
  );
}
