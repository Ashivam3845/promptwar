'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { SupportedLanguage, WorkType } from '@/types';
import { WORK_TYPE_OPTIONS, ALL_PLATFORMS, INDIAN_STATES } from '@/lib/profileOptions';
import {
  Settings,
  Languages,
  User,
  Shield,
  RotateCcw,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Sun,
  Moon,
} from 'lucide-react';

const INPUT_CLASS =
  'w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500 disabled:opacity-60';

export default function SettingsPage() {
  const { t, language, setLanguage } = useLanguage();
  const { theme, setTheme } = useTheme();
  const { mode, profile, store, updateProfile, logout } = useAuth();
  const isUser = mode === 'user';

  const [fullName, setFullName] = useState(profile?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber ?? '');
  const [workType, setWorkType] = useState<WorkType | ''>(profile?.workType ?? '');
  const [primaryPlatform, setPrimaryPlatform] = useState(profile?.primaryPlatform ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [state, setState] = useState(profile?.state ?? '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // The profile loads after the first render; fill the form once it arrives.
  const [loadedFor, setLoadedFor] = useState(profile?.id);
  if (profile && profile.id !== loadedFor) {
    setLoadedFor(profile.id);
    setFullName(profile.fullName);
    setPhoneNumber(profile.phoneNumber ?? '');
    setWorkType(profile.workType ?? '');
    setPrimaryPlatform(profile.primaryPlatform);
    setCity(profile.city);
    setState(profile.state ?? '');
  }

  const flash = (message: string) => {
    setError(null);
    setNotice(message);
    setTimeout(() => setNotice(null), 3000);
  };

  const changeLanguage = (lang: SupportedLanguage) => {
    setLanguage(lang);
    if (isUser) updateProfile({ preferredLanguage: lang });
  };

  const handleSaveProfile = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setError('Please enter your name.');
      return;
    }
    setBusy(true);
    const res = await updateProfile({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      workType: workType || undefined,
      primaryPlatform,
      city: city.trim(),
      state,
    });
    setBusy(false);
    if (res.success) flash('Profile saved.');
    else setError(res.error || 'Could not save your profile.');
  };

  const handleResetDemo = async () => {
    if (!store || !confirm('Restore the original sample data?')) return;
    await store.deleteAllData();
    flash('Sample data restored.');
  };

  const handleDeleteRecords = async () => {
    if (!store || !confirm('Permanently delete all your shifts and complaint drafts? This cannot be undone.')) return;
    setBusy(true);
    try {
      await store.deleteAllData();
      flash('All your shifts and complaint drafts were deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete your records.');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Permanently delete your account and all your data? This cannot be undone.')) return;
    setBusy(true);
    const res = await fetch('/api/account', { method: 'DELETE' });
    if (res.ok) {
      // The server already signed us out; this clears the client session and returns to the start.
      await logout();
      return;
    }
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    setError(data.error || 'Could not delete your account.');
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

      {notice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div role="alert" className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
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
            onClick={() => changeLanguage('en')}
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
            onClick={() => changeLanguage('hi')}
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
            onClick={() => changeLanguage('pa')}
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
      <form onSubmit={handleSaveProfile} className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-400" />
          <span>{t.settings.profileInfo}</span>
        </h2>

        {!isUser && <p className="text-xs text-amber-300">{t.journey.demoBanner}</p>}

        <fieldset disabled={!isUser || busy} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="set-name" className="block text-xs font-semibold text-slate-300 mb-1">{t.settings.workerName}</label>
              <input id="set-name" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} autoComplete="name" className={INPUT_CLASS} />
            </div>
            <div>
              <label htmlFor="set-phone" className="block text-xs font-semibold text-slate-300 mb-1">Phone</label>
              <input id="set-phone" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} autoComplete="tel" className={INPUT_CLASS} />
            </div>
            <div>
              <label htmlFor="set-worktype" className="block text-xs font-semibold text-slate-300 mb-1">{t.onboarding.workTypeTitle}</label>
              <select id="set-worktype" value={workType} onChange={(e) => setWorkType(e.target.value as WorkType | '')} className={INPUT_CLASS}>
                <option value="">—</option>
                {WORK_TYPE_OPTIONS.map((wt) => (
                  <option key={wt} value={wt}>{t.onboarding.workTypes[wt]}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="set-platform" className="block text-xs font-semibold text-slate-300 mb-1">{t.settings.primaryPlatform}</label>
              <select id="set-platform" value={primaryPlatform} onChange={(e) => setPrimaryPlatform(e.target.value)} className={INPUT_CLASS}>
                <option value="">—</option>
                {ALL_PLATFORMS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="set-state" className="block text-xs font-semibold text-slate-300 mb-1">{t.onboarding.state}</label>
              <select id="set-state" value={state} onChange={(e) => setState(e.target.value)} className={INPUT_CLASS}>
                <option value="">{t.onboarding.selectState}</option>
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="set-city" className="block text-xs font-semibold text-slate-300 mb-1">{t.settings.city}</label>
              <input id="set-city" type="text" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" className={INPUT_CLASS} />
            </div>
          </div>

          {isUser && (
            <div className="flex justify-end">
              <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 text-xs font-bold">
                {busy ? t.common.loading : t.common.save}
              </button>
            </div>
          )}
        </fieldset>
      </form>

      {/* Data Management & Privacy */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-400" />
          <span>{t.settings.dataManagement}</span>
        </h2>

        <p className="text-xs text-slate-300 leading-relaxed">{t.settings.privacyStatement}</p>

        {isUser ? (
          <>
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
              <div>
                <span className="text-xs font-semibold text-white block">Delete all my records</span>
                <span className="text-[11px] text-slate-400">Removes every shift and complaint draft you saved. Your account stays.</span>
              </div>
              <button
                onClick={handleDeleteRecords}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-200 text-xs font-semibold flex items-center gap-1.5 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete records</span>
              </button>
            </div>
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-800/80">
              <div>
                <span className="text-xs font-semibold text-rose-300 block">Delete my account</span>
                <span className="text-[11px] text-slate-400">Permanently deletes your login, profile, shifts and drafts.</span>
              </div>
              <button
                onClick={handleDeleteAccount}
                disabled={busy}
                className="px-3 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 disabled:opacity-60 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete account</span>
              </button>
            </div>
          </>
        ) : (
          <div className="pt-3 flex items-center justify-between border-t border-slate-800/80">
            <div>
              <span className="text-xs font-semibold text-white block">{t.settings.clearLocalData}</span>
              <span className="text-[11px] text-slate-400">{t.settings.clearNotice}</span>
            </div>
            <button
              onClick={handleResetDemo}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
