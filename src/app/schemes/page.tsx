'use client';

import React, { useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { searchSchemes, VERIFIED_SCHEMES } from '@/lib/schemes';
import { stateToJurisdiction } from '@/lib/profileOptions';

// Filter options come from the data, so a newly added state scheme appears automatically.
const JURISDICTIONS = Array.from(new Set(VERIFIED_SCHEMES.map((s) => s.jurisdiction)));
import {
  ShieldCheck,
  Search,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  FileCheck,
} from 'lucide-react';

export default function SchemesPage() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const { profile } = useAuth();
  // Until the user picks a filter, default to their own state (central schemes always show too).
  const [chosenJurisdiction, setJurisdiction] = useState<string | null>(null);
  const profileJurisdiction = stateToJurisdiction(profile?.state);
  const jurisdiction =
    chosenJurisdiction ??
    (profileJurisdiction && (JURISDICTIONS as string[]).includes(profileJurisdiction) ? profileJurisdiction : 'All');

  const schemes = useMemo(() => searchSchemes(searchQuery, jurisdiction), [searchQuery, jurisdiction]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-emerald-400" />
          <span>{t.schemes.title}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {t.schemes.subtitle}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label={t.common.search}
            placeholder={t.common.search + ' (e.g. e-Shram, accident insurance, pension, Delhi)'}
            className="w-full bg-[#0f172a] border border-slate-800 focus:border-emerald-500 text-sm rounded-xl pl-10 pr-4 py-3 text-white outline-none placeholder-slate-500"
          />
        </div>

        <div>
          <select
            aria-label="Filter by state or central schemes"
            value={jurisdiction}
            onChange={(e) => setJurisdiction(e.target.value)}
            className="w-full bg-[#0f172a] border border-slate-800 focus:border-emerald-500 text-sm rounded-xl px-4 py-3 text-slate-200 outline-none"
          >
            <option value="All">All Jurisdictions (National & States)</option>
            {JURISDICTIONS.map((j) => (
              <option key={j} value={j}>{j}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Knowledge Base Results */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {schemes.map((scheme) => {
          const localizedSummary =
            scheme.summary[language] || scheme.summary.en;

          return (
            <div
              key={scheme.id}
              className="rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition-all p-6 shadow-xl flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Badges */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {scheme.category}
                  </span>
                  <span className="text-xs font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded">
                    {scheme.jurisdiction}
                  </span>
                </div>

                {/* Scheme Name */}
                <h3 className="text-lg font-bold text-white leading-snug">
                  {scheme.name}
                </h3>

                {/* Summary */}
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  {localizedSummary}
                </p>

                {/* Verified Benefits */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{t.schemes.benefits}</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300 pl-1">
                    {scheme.verifiedBenefits.map((b, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 mt-1">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Eligibility Criteria */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <FileCheck className="w-3.5 h-3.5 text-sky-400" />
                    <span>{t.schemes.eligibility}</span>
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-300 pl-1">
                    {scheme.eligibilityCriteria.map((c, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-sky-400 mt-1">•</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Exclusions */}
                {scheme.relevantExclusions.length > 0 && (
                  <div className="space-y-1.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t.schemes.exclusions}</span>
                    </h4>
                    <ul className="space-y-1 text-xs text-slate-400 pl-1">
                      {scheme.relevantExclusions.map((ex, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 mt-1">•</span>
                          <span>{ex}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Bottom: Official Link & Verification Timestamp */}
              <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <span className="text-slate-500 text-[11px]">
                  {t.schemes.lastVerified} <strong className="text-slate-400">{scheme.lastVerifiedDate}</strong>
                </span>
                <a
                  href={scheme.officialSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-bold hover:underline"
                >
                  <span>{t.schemes.openOfficial}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
