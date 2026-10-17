'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { MIN_PASSWORD_LENGTH } from '@/lib/auth';
import { PasswordInput } from '@/components/PasswordInput';
import { AlertCircle, CheckCircle2, KeyRound, LoaderCircle } from 'lucide-react';

// Reached from the password-reset email (via /auth/callback, which signs the user in),
// or directly by a signed-in user who wants to change their password.
export default function ResetPasswordPage() {
  const router = useRouter();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const res = await updatePassword(password);
    setSubmitting(false);
    if (res.success) {
      setDone(true);
      setTimeout(() => router.replace('/dashboard'), 1500);
    } else {
      setError(res.error || 'Could not update password.');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4 animate-fadeIn">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-emerald-400" />
            <span>Set a new password</span>
          </h1>
          <p className="text-xs text-slate-400">Choose a password with at least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>

        {error && (
          <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {done ? (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Password updated. Taking you to your dashboard…</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder="New password"
              autoComplete="new-password"
            />
            <PasswordInput
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm new password"
              autoComplete="new-password"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              {submitting && <LoaderCircle className="w-4 h-4 animate-spin" />}
              <span>{submitting ? 'Updating…' : 'Update Password'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
