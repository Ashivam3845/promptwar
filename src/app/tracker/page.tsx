'use client';

import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { EarningsRecord } from '@/types';
import {
  getLocalEarningsRecords,
  saveLocalEarningsRecord,
  deleteLocalEarningsRecord,
} from '@/lib/storage';
import { validateEarningsInput, calculateEarnings } from '@/lib/calculations';
import {
  Wallet,
  PlusCircle,
  Calendar,
  Fuel,
  AlertTriangle,
  Clock,
  Trash2,
  Edit2,
  CheckCircle2,
  X,
  Filter,
  DollarSign,
  Info,
} from 'lucide-react';

export default function EarningsTrackerPage() {
  const { t, language } = useLanguage();
  const [records, setRecords] = useState<EarningsRecord[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [workDate, setWorkDate] = useState<string>('');
  const [todayStr, setTodayStr] = useState<string>('');
  const [platform, setPlatform] = useState<EarningsRecord['platform']>('Zomato');
  const [description, setDescription] = useState<string>('');
  const [grossEarnings, setGrossEarnings] = useState<string>('');
  const [incentives, setIncentives] = useState<string>('');
  const [fuelExpenses, setFuelExpenses] = useState<string>('');
  const [otherExpenses, setOtherExpenses] = useState<string>('');
  const [platformDeductions, setPlatformDeductions] = useState<string>('');
  const [hoursWorked, setHoursWorked] = useState<string>('');

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setWorkDate(today);
    setTodayStr(today);
    refreshRecords();
  }, []);

  const refreshRecords = () => {
    setRecords(getLocalEarningsRecords());
  };

  const resetForm = () => {
    setEditingId(null);
    setWorkDate(new Date().toISOString().split('T')[0]);
    setPlatform('Zomato');
    setDescription('');
    setGrossEarnings('');
    setIncentives('');
    setFuelExpenses('');
    setOtherExpenses('');
    setPlatformDeductions('');
    setHoursWorked('');
    setFormErrors({});
  };

  const handleOpenAdd = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (rec: EarningsRecord) => {
    setEditingId(rec.id);
    setWorkDate(rec.workDate);
    setPlatform(rec.platform);
    setDescription(rec.description || '');
    setGrossEarnings(String(rec.grossEarnings || ''));
    setIncentives(String(rec.incentives || ''));
    setFuelExpenses(String(rec.fuelExpenses || ''));
    setOtherExpenses(String(rec.otherExpenses || ''));
    setPlatformDeductions(String(rec.platformDeductions || ''));
    setHoursWorked(String(rec.hoursWorked || ''));
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this shift entry?')) {
      deleteLocalEarningsRecord(id);
      refreshRecords();
      setFeedbackMessage('Entry deleted.');
      setTimeout(() => setFeedbackMessage(null), 3000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateEarningsInput({
      workDate,
      grossEarnings,
      incentives,
      fuelExpenses,
      otherExpenses,
      platformDeductions,
      hoursWorked,
    });

    if (!validation.isValid) {
      setFormErrors(validation.errors);
      return;
    }

    saveLocalEarningsRecord({
      ...(editingId ? { id: editingId } : {}),
      workDate,
      platform,
      description,
      grossEarnings: Number(grossEarnings) || 0,
      incentives: Number(incentives) || 0,
      fuelExpenses: Number(fuelExpenses) || 0,
      otherExpenses: Number(otherExpenses) || 0,
      platformDeductions: Number(platformDeductions) || 0,
      hoursWorked: Number(hoursWorked) || 0,
    });

    setIsModalOpen(false);
    resetForm();
    refreshRecords();
    setFeedbackMessage(editingId ? 'Shift record updated!' : 'New shift recorded successfully!');
    setTimeout(() => setFeedbackMessage(null), 3500);
  };

  // Live preview calculation for the modal form
  const liveCalculation = calculateEarnings({
    grossEarnings,
    incentives,
    fuelExpenses,
    otherExpenses,
    platformDeductions,
    hoursWorked,
  });

  // Filter records
  const filteredRecords =
    selectedPlatform === 'All'
      ? records
      : records.filter((r) => r.platform === selectedPlatform);

  const totalFilteredNet = filteredRecords.reduce((acc, r) => acc + r.netEarnings, 0);
  const totalFilteredHours = filteredRecords.reduce((acc, r) => acc + r.hoursWorked, 0);
  const avgFilteredRate =
    totalFilteredHours > 0
      ? Math.round((totalFilteredNet / totalFilteredHours) * 100) / 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t.tracker.title}
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            {t.tracker.subtitle}
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all hover:scale-102"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t.tracker.addNew}</span>
        </button>
      </div>

      {feedbackMessage && (
        <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Deterministic Formula Callout */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3">
        <Info className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
        <div className="text-xs text-slate-300">
          <span className="font-semibold text-emerald-400">{t.tracker.formulaNotice}</span>
          <p className="mt-0.5 text-slate-400">
            Ensures honest accounting by stripping away false app gross figures to reflect real money earned per hour of your time.
          </p>
        </div>
      </div>

      {/* Filter and Weekly Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-1 bg-[#0f172a] border border-slate-800 rounded-xl p-4 flex flex-col justify-center">
          <label className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5" />
            <span>Filter by Platform</span>
          </label>
          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
          >
            <option value="All">{t.tracker.filterAll}</option>
            <option value="Zomato">Zomato</option>
            <option value="Swiggy">Swiggy</option>
            <option value="Uber">Uber</option>
            <option value="Ola">Ola</option>
            <option value="Blinkit">Blinkit</option>
            <option value="Zepto">Zepto</option>
            <option value="Porter">Porter</option>
            <option value="Urban Company">Urban Company</option>
            <option value="Daily Wage / Construction">Daily Wage / Construction</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {t.tracker.totalEarned}
          </span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            ₹{totalFilteredNet.toLocaleString('en-IN')}
          </div>
          <span className="text-[10px] text-slate-500">Filtered net sum</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {t.tracker.totalHours}
          </span>
          <div className="text-2xl font-bold text-white mt-1">
            {totalFilteredHours} hrs
          </div>
          <span className="text-[10px] text-slate-500">{filteredRecords.length} shifts recorded</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {t.tracker.avgHourly}
          </span>
          <div className="text-2xl font-bold text-emerald-400 mt-1">
            ₹{avgFilteredRate}/hr
          </div>
          <span className="text-[10px] text-slate-500">Effective wage rate</span>
        </div>
      </div>

      {/* Entries List */}
      <div className="rounded-xl border border-slate-800 bg-[#0f172a] shadow-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white">
            Shift Records ({filteredRecords.length})
          </h2>
          <span className="text-xs text-slate-400">
            Sorted newest first
          </span>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Wallet className="w-10 h-10 mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-medium">No shifts match the current filter.</p>
            <button
              onClick={handleOpenAdd}
              className="mt-3 text-xs text-emerald-400 hover:underline font-semibold"
            >
              Record a shift now
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/80">
            {filteredRecords.map((r) => (
              <div
                key={r.id}
                className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-200 border border-slate-700">
                      {r.platform}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {r.workDate}
                    </span>
                    {r.hoursWorked > 0 && (
                      <span className="text-xs text-slate-500">
                        • {r.hoursWorked} hrs
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-white">
                    {r.description || 'Regular shift'}
                  </p>
                  
                  {/* Itemized math badges */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] pt-1">
                    <span className="text-slate-300">
                      Gross: ₹{r.grossEarnings}
                    </span>
                    {r.incentives > 0 && (
                      <span className="text-emerald-400 font-medium">
                        +₹{r.incentives} bonus
                      </span>
                    )}
                    {(r.fuelExpenses > 0 || r.otherExpenses > 0) && (
                      <span className="text-amber-400">
                        −₹{r.totalExpenses} (fuel/exp)
                      </span>
                    )}
                    {r.platformDeductions > 0 && (
                      <span className="text-rose-400 font-medium">
                        −₹{r.platformDeductions} (cut)
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Summary & Actions */}
                <div className="flex items-center justify-between md:justify-end gap-6 pt-3 md:pt-0 border-t md:border-t-0 border-slate-800/80">
                  <div className="text-left md:text-right">
                    <div className="text-lg font-black text-emerald-400">
                      ₹{r.netEarnings.toLocaleString('en-IN')}
                    </div>
                    {r.effectiveHourlyRate !== null && (
                      <div className="text-xs text-slate-400">
                        ≈ ₹{r.effectiveHourlyRate}/hr
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEdit(r)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Edit record"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-[#0f172a] px-6 py-4 border-b border-slate-800 flex items-center justify-between z-10">
              <h3 className="text-lg font-bold text-white">
                {editingId ? 'Edit Shift Record' : t.tracker.addNew}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Date & Platform */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.tracker.date} *
                  </label>
                  <input
                    type="date"
                    value={workDate}
                    max={todayStr}
                    onChange={(e) => setWorkDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                  {formErrors.workDate && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.workDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.tracker.platform} *
                  </label>
                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  >
                    <option value="Zomato">Zomato</option>
                    <option value="Swiggy">Swiggy</option>
                    <option value="Uber">Uber</option>
                    <option value="Ola">Ola</option>
                    <option value="Blinkit">Blinkit</option>
                    <option value="Zepto">Zepto</option>
                    <option value="Porter">Porter</option>
                    <option value="Urban Company">Urban Company</option>
                    <option value="Daily Wage / Construction">Daily Wage / Construction</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Shift Notes / Area
                </label>
                <input
                  type="text"
                  placeholder="e.g., Evening dinner slot in Indiranagar, 12 orders completed"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              {/* Gross & Incentives */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.tracker.gross}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={grossEarnings}
                    onChange={(e) => setGrossEarnings(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                  {formErrors.grossEarnings && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.grossEarnings}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.tracker.incentives}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={incentives}
                    onChange={(e) => setIncentives(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                  {formErrors.incentives && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.incentives}</p>
                  )}
                </div>
              </div>

              {/* Expenses: Fuel & Maintenance */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.tracker.fuel}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={fuelExpenses}
                    onChange={(e) => setFuelExpenses(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                  {formErrors.fuelExpenses && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.fuelExpenses}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.tracker.otherExpenses}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={otherExpenses}
                    onChange={(e) => setOtherExpenses(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                  {formErrors.otherExpenses && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.otherExpenses}</p>
                  )}
                </div>
              </div>

              {/* Deductions & Hours */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.tracker.deductions}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0"
                    value={platformDeductions}
                    onChange={(e) => setPlatformDeductions(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                  {formErrors.platformDeductions && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.platformDeductions}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    {t.tracker.hours}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    placeholder="e.g. 7.5"
                    value={hoursWorked}
                    onChange={(e) => setHoursWorked(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                  />
                  {formErrors.hoursWorked && (
                    <p className="text-[11px] text-rose-400 mt-1">{formErrors.hoursWorked}</p>
                  )}
                </div>
              </div>

              {/* Live Preview Box */}
              <div className="p-3.5 rounded-xl bg-slate-900/80 border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                    Calculated Take-Home
                  </span>
                  <div className="text-xl font-black text-emerald-400">
                    ₹{liveCalculation.netEarnings.toLocaleString('en-IN')}
                  </div>
                </div>
                {liveCalculation.effectiveHourlyRate !== null && (
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                      Effective Rate
                    </span>
                    <div className="text-sm font-bold text-slate-200">
                      ₹{liveCalculation.effectiveHourlyRate}/hr
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  {t.common.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20"
                >
                  {t.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
