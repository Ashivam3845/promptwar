'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { ComplaintDraft } from '@/types';
import {
  getLocalComplaints,
  saveLocalComplaint,
  deleteLocalComplaint,
} from '@/lib/complaintStorage';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Bookmark,
  Trash2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Clock,
  ShieldAlert,
  Send,
} from 'lucide-react';

export default function ComplaintsPage() {
  const { t, language } = useLanguage();
  const [drafts, setDrafts] = useState<ComplaintDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<ComplaintDraft | null>(null);

  // Form states
  const [description, setDescription] = useState('');
  const [platformOrEmployer, setPlatformOrEmployer] = useState('Zomato');
  const [incidentDate, setIncidentDate] = useState('');
  const [todayStr, setTodayStr] = useState('');

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setIncidentDate(today);
    setTodayStr(today);
  }, []);
  const [amountDisputed, setAmountDisputed] = useState('');
  const [recipientCategory, setRecipientCategory] =
    useState<ComplaintDraft['recipientCategory']>('Company Grievance Cell');

  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    refreshDrafts();
  }, []);

  const refreshDrafts = () => {
    const list = getLocalComplaints();
    setDrafts(list);
    if (list.length > 0 && !activeDraft) {
      setActiveDraft(list[0]);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || loading) return;

    setErrorNotice(null);
    setLoading(true);

    try {
      const response = await fetch('/api/complaints/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          platformOrEmployer,
          incidentDate,
          amountDisputed: amountDisputed ? Number(amountDisputed) : undefined,
          recipientCategory,
          language,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate complaint');
      }

      const generated: ComplaintDraft = {
        id: 'draft-gen-' + Date.now(),
        title: data.title || 'Grievance Representation',
        platformOrEmployer: data.platformOrEmployer,
        incidentDate: data.incidentDate,
        amountDisputed: data.amountDisputed,
        recipientCategory: data.recipientCategory,
        subject: data.subject,
        formalLetter: data.formalLetter,
        factsSummary: data.factsSummary || [],
        legalFairnessBasis: data.legalFairnessBasis || [],
        requestedRelief: data.requestedRelief || [],
        supportingEvidence: data.supportingEvidence || [],
        language: data.language || language,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };

      setActiveDraft(generated);
    } catch (err: any) {
      console.error('Complaint generation error:', err);
      setErrorNotice(err.message || 'Error communicating with AI service');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveActive = () => {
    if (!activeDraft) return;
    saveLocalComplaint(activeDraft);
    refreshDrafts();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this complaint draft?')) {
      deleteLocalComplaint(id);
      refreshDrafts();
      if (activeDraft?.id === id) {
        setActiveDraft(null);
      }
    }
  };

  const handleCopy = () => {
    if (!activeDraft) return;
    navigator.clipboard.writeText(
      `SUBJECT: ${activeDraft.subject}\n\n${activeDraft.formalLetter}`
    );
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <FileText className="w-7 h-7 text-emerald-400" />
          <span>{t.complaints.title}</span>
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          {t.complaints.subtitle}
        </p>
      </div>

      {/* Generation Form */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800 p-6 shadow-xl space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <span>New Grievance Request</span>
        </h2>

        {errorNotice && (
          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Notice:</span> {errorNotice}
              <p className="mt-1 text-[11px] text-amber-400/80">
                To activate live OpenAI model letter generation, configure <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-200">OPENAI_API_KEY</code> in your <code className="bg-slate-900 px-1 py-0.5 rounded text-amber-200">.env.local</code>.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.complaints.platform} *
              </label>
              <input
                type="text"
                value={platformOrEmployer}
                onChange={(e) => setPlatformOrEmployer(e.target.value)}
                placeholder="e.g. Zomato, Swiggy, Uber, Blinkit"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.complaints.incidentDate} *
              </label>
              <input
                type="date"
                value={incidentDate}
                max={todayStr}
                onChange={(e) => setIncidentDate(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t.complaints.amountDisputed}
              </label>
              <input
                type="number"
                value={amountDisputed}
                onChange={(e) => setAmountDisputed(e.target.value)}
                placeholder="e.g. 500"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.complaints.recipientCategory}
            </label>
            <select
              value={recipientCategory}
              onChange={(e) => setRecipientCategory(e.target.value as any)}
              className="w-full sm:w-1/2 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
            >
              <option value="Company Grievance Cell">Company Grievance Cell (First Escalation)</option>
              <option value="State Labour Commissioner">State Labour Commissioner / Gig Welfare Board</option>
              <option value="National Consumer Helpline (NCH)">National Consumer Helpline (NCH 1915)</option>
              <option value="Police / Legal Cell">Police / Legal Assistance Desk</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t.complaints.describeProblem} *
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t.complaints.describeHelp}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none focus:border-emerald-500 placeholder-slate-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-slate-400">
              {t.complaints.disclaimer}
            </p>
            <button
              type="submit"
              disabled={!description.trim() || loading}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? t.complaints.generating : t.complaints.generateDraft}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Generated or Selected Draft Display */}
      {activeDraft && (
        <div className="rounded-2xl bg-[#0f172a] border border-emerald-500/30 p-6 shadow-2xl space-y-6 animate-fadeIn">
          {/* Draft Title & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                {activeDraft.recipientCategory}
              </span>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {activeDraft.title}
              </h3>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">{t.common.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>{t.common.copy}</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSaveActive}
                className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-colors"
              >
                <Bookmark className="w-4 h-4" />
                <span>{saveSuccess ? t.common.saved : t.common.save}</span>
              </button>
            </div>
          </div>

          {/* Subject Line */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {t.complaints.subject}
            </label>
            <input
              type="text"
              value={activeDraft.subject}
              onChange={(e) =>
                setActiveDraft({ ...activeDraft, subject: e.target.value })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2.5 text-xs font-semibold text-emerald-300 outline-none focus:border-emerald-500"
            />
          </div>

          {/* Editable Formal Letter Body */}
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {t.complaints.letterBody}
            </label>
            <textarea
              rows={12}
              value={activeDraft.formalLetter}
              onChange={(e) =>
                setActiveDraft({ ...activeDraft, formalLetter: e.target.value })
              }
              className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-mono outline-none focus:border-emerald-500"
            />
          </div>

          {/* Structured Points Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {/* Facts Summary */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>{t.complaints.facts}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {activeDraft.factsSummary.map((f, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-slate-500">•</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal Basis */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sky-400" />
                <span>{t.complaints.legalBasis}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {activeDraft.legalFairnessBasis.map((l, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-slate-500">•</span>
                    <span>{l}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Requested Relief */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>{t.complaints.requestedRelief}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {activeDraft.requestedRelief.map((r, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-slate-500">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Supporting Evidence */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span>{t.complaints.supportingEvidence}</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {activeDraft.supportingEvidence.map((e, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-slate-500">•</span>
                    <span>{e}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Saved Drafts History Section */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white">
          {t.complaints.savedDrafts} ({drafts.length})
        </h3>

        {drafts.length === 0 ? (
          <div className="p-6 rounded-xl bg-[#0f172a] border border-slate-800 text-center text-xs text-slate-400">
            {t.complaints.noSaved}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {drafts.map((d) => (
              <div
                key={d.id}
                onClick={() => setActiveDraft(d)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  activeDraft?.id === d.id
                    ? 'bg-[#131f38] border-emerald-500/50 shadow-md'
                    : 'bg-[#0f172a] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                  <span className="font-semibold text-emerald-400">
                    {d.platformOrEmployer}
                  </span>
                  <span>{d.incidentDate}</span>
                </div>
                <h4 className="text-sm font-bold text-white line-clamp-1">
                  {d.title}
                </h4>
                <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                  {d.subject}
                </p>
                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">
                    {d.recipientCategory}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(d.id);
                    }}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
