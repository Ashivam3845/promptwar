'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { ComplaintDraft, DocumentAnalysisResult } from '@/types';
import { stashPendingDraft, takePendingDraft } from '@/lib/pendingDraft';
import {
  FileText,
  Sparkles,
  Copy,
  Check,
  Bookmark,
  Trash2,
  AlertCircle,
  Upload,
  FileCheck2,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';

export default function ComplaintsPage() {
  const { t, language } = useLanguage();
  // Guests can generate a draft right away; saving needs an account (or demo mode).
  const { store, profile } = useAuth();
  const [drafts, setDrafts] = useState<ComplaintDraft[]>([]);
  const [activeDraft, setActiveDraft] = useState<ComplaintDraft | null>(null);

  // Form states
  const [description, setDescription] = useState('');
  const [platformOrEmployer, setPlatformOrEmployer] = useState(profile?.primaryPlatform || 'Zomato');
  const [incidentDate, setIncidentDate] = useState('');
  const [todayStr, setTodayStr] = useState('');
  const [amountDisputed, setAmountDisputed] = useState('');
  const [recipientCategory, setRecipientCategory] =
    useState<ComplaintDraft['recipientCategory']>('Company Grievance Cell');

  // Document Intelligence (Sarvam Vision) Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
  const [docAnalysisResult, setDocAnalysisResult] = useState<DocumentAnalysisResult | null>(null);
  const [docUploadError, setDocUploadError] = useState<string | null>(null);
  const [isTransferred, setIsTransferred] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const refreshDrafts = async (openId?: string | null) => {
    if (!store) return;
    try {
      const list = await store.listComplaints();
      setDrafts(list);
      const requested = openId ? list.find((d) => d.id === openId) : undefined;
      if (requested) setActiveDraft(requested);
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Could not load saved drafts.');
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    // Today's date comes from the browser clock, which is unknown while prerendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIncidentDate(today);
    setTodayStr(today);
    // ?draft=<id> (from the dashboard) reopens that saved draft.
    refreshDrafts(new URLSearchParams(window.location.search).get('draft'));
    // A draft generated before signing in comes back here, ready to save.
    if (store) {
      const pending = takePendingDraft();
      if (pending) setActiveDraft(pending);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  // Handle Document Upload & Analysis via Sarvam Vision
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setDocUploadError(null);
    setDocAnalysisResult(null);
    setIsTransferred(false);
    setIsAnalyzingDoc(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('language', language);

    try {
      const res = await fetch('/api/documents/analyze', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze document');
      }

      setDocAnalysisResult(data);
    } catch (err) {
      console.error('Doc analysis error:', err);
      setDocUploadError((err instanceof Error && err.message) || 'Error communicating with document analysis service.');
    } finally {
      setIsAnalyzingDoc(false);
    }
  };

  // Explicit user confirmation to transfer verified extracted fields into the grievance form
  const handleConfirmAndTransfer = () => {
    if (!docAnalysisResult?.fields) return;
    const { platformName, amountDisputed: extAmount, incidentDate: extDate, deductionReason, orderIdOrRef } =
      docAnalysisResult.fields;

    if (platformName) setPlatformOrEmployer(platformName);
    if (extAmount) setAmountDisputed(String(extAmount));
    if (extDate) setIncidentDate(extDate);

    // Build or enrich the problem description
    const refText = orderIdOrRef ? ` (Ref/Order ID: #${orderIdOrRef})` : '';
    const reasonText = deductionReason ? ` for alleged "${deductionReason}"` : '';
    const autoSummary = `Unfair deduction of ₹${extAmount || 'disputed amount'}${reasonText}${refText}. As seen on my payout statement, this was deducted without prior notice or fair opportunity to be heard.`;

    setDescription((prev) => (prev ? `${prev}\n\n[Document Evidence]: ${autoSummary}` : autoSummary));
    setIsTransferred(true);
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
    } catch (err) {
      console.error('Complaint generation error:', err);
      setErrorNotice((err instanceof Error && err.message) || 'Error communicating with AI service');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveActive = async () => {
    if (!activeDraft || !store) return;
    try {
      const saved = await store.saveComplaint(activeDraft);
      setActiveDraft(saved);
      setDrafts((prev) => [saved, ...prev.filter((d) => d.id !== saved.id)]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Could not save this draft.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!store || !confirm('Delete this complaint draft?')) return;
    try {
      await store.deleteComplaint(id);
      setDrafts((prev) => prev.filter((d) => d.id !== id));
      if (activeDraft?.id === id) {
        setActiveDraft(null);
      }
    } catch (err) {
      setErrorNotice(err instanceof Error ? err.message : 'Could not delete this draft.');
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

      {/* Feature 2: Sarvam Document Intelligence Card */}
      <div className="rounded-2xl bg-[#0f172a] border border-sky-500/30 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold text-white">
              AI Document Intelligence (Deduction Screenshot / Statement OCR)
            </h2>
          </div>
          <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/30 px-2.5 py-0.5 rounded-full self-start sm:self-auto">
            Powered by Sarvam Vision
          </span>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          Upload a screenshot of your app deduction, penalty SMS, or weekly settlement slip (PNG, JPEG, PDF up to 10MB).
          Sarvam Vision will extract the candidate dates, amounts, and platform details. You can review, edit, or reject the extracted facts before sending them to the complaint generator.
        </p>

        {/* Upload Input Area */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/png,image/jpeg,image/jpg,image/webp,application/pdf"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isAnalyzingDoc}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            {isAnalyzingDoc ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing via Sarvam Vision...</span>
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                <span>Upload Statement / Screenshot</span>
              </>
            )}
          </button>

          {selectedFile && (
            <span className="text-xs text-slate-400 font-mono truncate max-w-xs">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
            </span>
          )}
        </div>

        {docUploadError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{docUploadError}</span>
          </div>
        )}

        {/* Extracted Document Intelligence Candidate Fields Review Box */}
        {docAnalysisResult && (
          <div className="p-4 rounded-xl bg-slate-900/90 border border-sky-500/40 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4" />
                <span>Extracted Document Facts (Review & Correct)</span>
              </span>
              <span className="text-[10px] text-slate-400">
                Facts extracted from uploaded file: {docAnalysisResult.filename}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block">Detected Platform</span>
                <span className="font-semibold text-white">
                  {docAnalysisResult.fields.platformName || 'Not detected'}
                </span>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block">Disputed Amount</span>
                <span className="font-bold text-rose-400">
                  {docAnalysisResult.fields.amountDisputed ? `₹${docAnalysisResult.fields.amountDisputed}` : 'Not detected'}
                </span>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block">Reference Date</span>
                <span className="font-semibold text-white">
                  {docAnalysisResult.fields.incidentDate || 'Not detected'}
                </span>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700">
                <span className="text-[10px] text-slate-400 font-bold block">Order / Ref ID</span>
                <span className="font-semibold text-white">
                  {docAnalysisResult.fields.orderIdOrRef || 'None'}
                </span>
              </div>
            </div>

            {/* Confidence & Supporting notes */}
            {docAnalysisResult.confidenceNotes?.length > 0 && (
              <div className="text-[11px] text-slate-400 space-y-0.5">
                <span className="font-semibold text-slate-300">Extraction Observations:</span>
                <ul className="list-disc list-inside text-slate-400 pl-1">
                  {docAnalysisResult.confidenceNotes.map((note: string, idx: number) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-1 border-t border-slate-800">
              <p className="text-[11px] text-amber-300/80">
                * Note: Extracting facts does not constitute a legal determination of unlawfulness.
              </p>
              <button
                type="button"
                onClick={handleConfirmAndTransfer}
                disabled={isTransferred}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  isTransferred
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 cursor-default'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20'
                }`}
              >
                {isTransferred ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Transferred to Form</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Confirm & Fill Form</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
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
              onChange={(e) => setRecipientCategory(e.target.value as ComplaintDraft['recipientCategory'])}
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

              {store ? (
                <button
                  onClick={handleSaveActive}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-colors"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>{saveSuccess ? t.common.saved : t.common.save}</span>
                </button>
              ) : (
                <Link
                  href="/login?mode=signup&next=/complaints"
                  onClick={() => stashPendingDraft(activeDraft)}
                  title={t.journey.signInToSave}
                  className="px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-colors"
                >
                  <Bookmark className="w-4 h-4" />
                  <span>{t.journey.signInToSaveCta}</span>
                </Link>
              )}
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
