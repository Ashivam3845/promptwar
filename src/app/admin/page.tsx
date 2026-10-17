'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchAdminOverview } from '@/lib/workspace';
import { summarizeEarnings } from '@/lib/calculations';
import { UserProfile, EarningsRecord, ComplaintDraft } from '@/types';
import {
  ShieldAlert,
  Users,
  Wallet,
  FileText,
  Search,
  TrendingUp,
} from 'lucide-react';

export default function AdminPortalPage() {
  const router = useRouter();
  const { user, isAdmin, loading } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [earnings, setEarnings] = useState<EarningsRecord[]>([]);
  const [complaints, setComplaints] = useState<ComplaintDraft[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Real workers only: no sample data, so the numbers reflect actual signups and records.
    async function loadData() {
      if (!supabase || !isAdmin) return;
      try {
        const overview = await fetchAdminOverview(supabase);
        setUsers(overview.users);
        setEarnings(overview.earnings);
        setComplaints(overview.complaints);
        setLoadError(null);
      } catch (err) {
        setLoadError(err instanceof Error ? err.message : 'Could not load worker data.');
      }
    }
    loadData();
  }, [isAdmin]);

  // Aggregate metrics and filters, recomputed only when their inputs change.
  const totalWorkers = useMemo(() => users.filter((u) => u.role === 'worker').length, [users]);
  const { totalGross: totalPlatformGross, totalNet: totalNetTakeHome } = useMemo(
    () => summarizeEarnings(earnings),
    [earnings]
  );
  const totalDisputedGrievances = complaints.length;

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return users.filter((u) =>
      [u.fullName, u.email, u.primaryPlatform, u.city].some((field) => field.toLowerCase().includes(q))
    );
  }, [users, searchQuery]);

  const userEarnings = useMemo(() => earnings.filter((e) => e.userId === selectedUser?.id), [earnings, selectedUser]);
  const userComplaints = useMemo(
    () => complaints.filter((c) => c.userId === selectedUser?.id),
    [complaints, selectedUser]
  );

  if (loading) {
    return <div className="text-center text-xs text-slate-400 py-16">Loading…</div>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto mt-10 bg-[#0f172a] border border-rose-500/30 rounded-2xl p-6 text-center space-y-3">
        <ShieldAlert className="w-10 h-10 text-rose-400 mx-auto" />
        <h1 className="text-lg font-bold text-white">Admin access required</h1>
        <p className="text-xs text-slate-400">Your account does not have supervisor permissions.</p>
        <button
          onClick={() => router.replace('/dashboard')}
          className="text-xs font-bold text-emerald-400 hover:underline"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {loadError && (
        <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
          {loadError}
        </div>
      )}

      {/* Admin Access Notice Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-950/40 via-[#0e172a] to-[#0a1224] border border-rose-500/30 p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold mb-2">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Supervisor / Administrator Control Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Worker Network & Audit Hub
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-slate-300">
              Audit all registered gig workers, inspect aggregate shifts, verify wage deductions, and review submitted grievance letters.
            </p>
          </div>

          <div className="text-xs text-slate-400 bg-slate-900/90 border border-slate-800 p-3 rounded-xl shrink-0">
            <span className="block text-slate-500 text-[10px] uppercase font-bold">Logged In As</span>
            <span className="font-bold text-white">{user?.fullName || 'Guest'}</span>
            <span className="text-[10px] block text-rose-400">({user?.role || 'No Role'})</span>
          </div>
        </div>
      </div>

      {/* Aggregate Administrative KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Registered Workers</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-white mt-2">
            {totalWorkers}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Active across platforms</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Total Gross Tracked</span>
            <TrendingUp className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-3xl font-black text-sky-400 mt-2">
            ₹{totalPlatformGross.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Platform logged earnings</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Net Take-Home Pay</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-2">
            ₹{totalNetTakeHome.toLocaleString('en-IN')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Real net earnings in-hand</span>
        </div>

        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Grievances Filed</span>
            <FileText className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black text-rose-400 mt-2">
            {totalDisputedGrievances}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Disputes & penalty letters</span>
        </div>
      </div>

      {/* User Management Directory */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-400" />
              <span>Worker & User Accounts Directory ({users.length})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Select any worker to inspect their detailed shift breakdown and saved grievance drafts.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, platform, city..."
              className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs rounded-xl pl-9 pr-3 py-2.5 text-white outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 text-[11px] text-slate-400 uppercase font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Platform</th>
                <th className="py-3 px-4">City</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredUsers.map((u) => (
                <tr
                  key={u.id}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    selectedUser?.id === u.id ? 'bg-slate-800/60' : ''
                  }`}
                >
                  <td className="py-3.5 px-4 font-semibold text-white">
                    <div>{u.fullName}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{u.email}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.role === 'admin'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-200">{u.primaryPlatform}</td>
                  <td className="py-3.5 px-4 text-slate-400">{u.city}</td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {u.createdAt.split('T')[0]}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedUser(u)}
                      className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] font-bold transition-all"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected User Detail Modal / Bottom Drawer */}
      {selectedUser && (
        <div className="bg-[#0f172a] border border-emerald-500/40 rounded-2xl p-6 shadow-2xl space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                Worker Audit Dossier
              </span>
              <h3 className="text-xl font-bold text-white mt-0.5">
                {selectedUser.fullName}
              </h3>
              <p className="text-xs text-slate-400">{selectedUser.email} • {selectedUser.phoneNumber}</p>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-xs text-slate-400 hover:text-white px-3 py-1 bg-slate-800 rounded-lg"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Logged Shifts for this worker */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center justify-between">
                <span>Shift Records Ledger</span>
                <span className="text-emerald-400">{userEarnings.length} shifts found</span>
              </h4>
              <div className="divide-y divide-slate-800 text-xs max-h-48 overflow-y-auto pr-1">
                {userEarnings.map((e) => (
                  <div key={e.id} className="py-2 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-slate-200">{e.platform}</span>
                      <span className="text-slate-500 ml-2">({e.workDate})</span>
                      <div className="text-[10px] text-slate-400">{e.description}</div>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-400">₹{e.netEarnings}</span>
                      <div className="text-[10px] text-slate-500">Gross: ₹{e.grossEarnings}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Grievance letters drafted */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-white flex items-center justify-between">
                <span>Formal Grievances Drafted</span>
                <span className="text-rose-400">{userComplaints.length} letters</span>
              </h4>
              <div className="divide-y divide-slate-800 text-xs max-h-48 overflow-y-auto pr-1">
                {userComplaints.map((c) => (
                  <div key={c.id} className="py-2 space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{c.title}</span>
                      <span className="text-rose-400 font-bold">₹{c.amountDisputed}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{c.subject}</div>
                    <div className="text-[10px] text-slate-500">{c.recipientCategory} • {c.incidentDate}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
