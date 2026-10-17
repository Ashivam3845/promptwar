'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { fill } from '@/lib/i18n-journey';
import { hasPendingDraft } from '@/lib/pendingDraft';
import { WORK_TYPE_OPTIONS, PLATFORMS_BY_WORK_TYPE, ALL_PLATFORMS, INDIAN_STATES } from '@/lib/profileOptions';
import { SupportedLanguage, WorkType, UserProfile } from '@/types';
import { Languages, Bike, Building2, MapPin, Info, AlertCircle, LoaderCircle, Check } from 'lucide-react';

const LANGUAGE_OPTIONS: { code: SupportedLanguage; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिन्दी' },
  { code: 'pa', label: 'ਪੰਜਾਬੀ' },
];

const STEPS = ['language', 'workType', 'platform', 'location'] as const;
const STEP_ICONS = { language: Languages, workType: Bike, platform: Building2, location: MapPin };

export default function OnboardingPage() {
  const { user } = useAuth();
  if (!user) {
    return (
      <div className="flex justify-center py-16">
        <LoaderCircle className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }
  // Mount the flow once the profile is known so answers can be pre-filled.
  return <OnboardingFlow user={user} />;
}

function OnboardingFlow({ user }: { user: UserProfile }) {
  const router = useRouter();
  const { updateProfile } = useAuth();
  const { t, language, setLanguage } = useLanguage();
  const o = t.onboarding;

  const [stepIndex, setStepIndex] = useState(0);
  const [workType, setWorkType] = useState<WorkType | undefined>(user.workType);
  const [platform, setPlatform] = useState(user.primaryPlatform);
  const [city, setCity] = useState(user.city);
  const [state, setState] = useState(user.state || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;
  const Icon = STEP_ICONS[step];
  const platformChoices = workType ? PLATFORMS_BY_WORK_TYPE[workType] : ALL_PLATFORMS;

  const finish = async (answers = { workType, platform, city, state }) => {
    setSaving(true);
    setError(null);
    const res = await updateProfile({
      preferredLanguage: language,
      workType: answers.workType,
      primaryPlatform: answers.platform,
      city: answers.city.trim(),
      state: answers.state,
      onboarded: true,
    });
    if (res.success) {
      // Guests who signed up to save a complaint go straight back to it.
      router.replace(hasPendingDraft() ? '/complaints' : '/dashboard');
    } else {
      setSaving(false);
      setError(res.error || 'Could not save your profile.');
    }
  };

  const goNext = () => (isLast ? finish() : setStepIndex((i) => i + 1));

  // Skipping clears the current step's answer so nothing is saved for it.
  const skip = () => {
    if (step === 'workType') setWorkType(undefined);
    if (step === 'platform') setPlatform('');
    if (step === 'location') {
      setCity('');
      setState('');
      finish({ workType, platform, city: '', state: '' });
      return;
    }
    goNext();
  };

  const titles = {
    language: [o.languageTitle, o.languageWhy],
    workType: [o.workTypeTitle, o.workTypeWhy],
    platform: [o.platformTitle, o.platformWhy],
    location: [o.locationTitle, o.locationWhy],
  } as const;
  const [title, why] = titles[step];

  const optionClass = (selected: boolean) =>
    `w-full text-left px-4 py-3 rounded-xl border text-sm font-semibold transition-all flex items-center justify-between ${
      selected
        ? 'bg-emerald-500/15 border-emerald-500 text-emerald-300'
        : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
    }`;

  return (
    <div className="max-w-md mx-auto pt-4 space-y-5 animate-fadeIn">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span>{fill(o.stepOf, { current: stepIndex + 1, total: STEPS.length })}</span>
          {step !== 'language' && (
            <span className="text-slate-500">{o.optional}</span>
          )}
        </div>
        <div className="flex gap-1.5" aria-hidden="true">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-1.5 flex-1 rounded-full ${i <= stepIndex ? 'bg-emerald-500' : 'bg-slate-800'}`} />
          ))}
        </div>
      </div>

      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="space-y-2">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
            <Icon className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold text-white">{title}</h1>
          <p className="text-xs text-slate-400 flex items-start gap-1.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{why}</span>
          </p>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {step === 'language' && (
          <div className="space-y-2" role="radiogroup">
            {LANGUAGE_OPTIONS.map((opt) => (
              <button
                key={opt.code}
                type="button"
                role="radio"
                aria-checked={language === opt.code}
                onClick={() => setLanguage(opt.code)}
                className={optionClass(language === opt.code)}
              >
                <span>{opt.label}</span>
                {language === opt.code && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}

        {step === 'workType' && (
          <div className="space-y-2" role="radiogroup">
            {WORK_TYPE_OPTIONS.map((wt) => (
              <button
                key={wt}
                type="button"
                role="radio"
                aria-checked={workType === wt}
                onClick={() => {
                  setWorkType(wt);
                  if (platform && !PLATFORMS_BY_WORK_TYPE[wt].includes(platform as never)) setPlatform('');
                }}
                className={optionClass(workType === wt)}
              >
                <span>{o.workTypes[wt]}</span>
                {workType === wt && <Check className="w-4 h-4" />}
              </button>
            ))}
          </div>
        )}

        {step === 'platform' && (
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {platformChoices.map((p) => (
              <button
                key={p}
                type="button"
                role="radio"
                aria-checked={platform === p}
                onClick={() => setPlatform(p)}
                className={optionClass(platform === p)}
              >
                <span className="truncate">{p}</span>
              </button>
            ))}
          </div>
        )}

        {step === 'location' && (
          <div className="space-y-3">
            <div>
              <label htmlFor="onb-state" className="block text-xs font-semibold text-slate-300 mb-1">{o.state}</label>
              <select
                id="onb-state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-sm rounded-xl px-3 py-2.5 text-white outline-none"
              >
                <option value="">{o.selectState}</option>
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="onb-city" className="block text-xs font-semibold text-slate-300 mb-1">{o.city}</label>
              <input
                id="onb-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="address-level2"
                className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-sm rounded-xl px-3 py-2.5 text-white outline-none"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={() => setStepIndex((i) => i - 1)}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl border border-slate-700 text-xs font-bold text-slate-300 hover:text-white"
            >
              {o.back}
            </button>
          )}
          {step !== 'language' && (
            <button
              type="button"
              onClick={skip}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white"
            >
              {o.skip}
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={saving}
            className="ml-auto px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5"
          >
            {saving && <LoaderCircle className="w-4 h-4 animate-spin" />}
            <span>{saving ? o.saving : isLast ? o.finish : o.next}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
