'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Mail, AlertCircle, MailCheck, ArrowLeft, LoaderCircle, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setSubmitting(true);
    const res = await requestPasswordReset(email);
    setSubmitting(false);
    if (res.success) {
      setSent(true);
    } else {
      setError(res.error || 'Could not send reset email.');
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4 animate-fadeIn">
      <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        {sent ? (
          <div className="space-y-4 text-center">
            <MailCheck className="w-10 h-10 text-emerald-400 mx-auto" />
            <h1 className="text-lg font-bold text-white">Check your email</h1>
            <p className="text-xs text-slate-300">
              If an account exists for <span className="font-bold text-white">{email.trim()}</span>, we sent a
              link to reset your password.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-400" />
                <span>Reset your password</span>
              </h1>
              <p className="text-xs text-slate-400">
                Enter the email you signed up with and we will send you a reset link.
              </p>
            </div>

            {error && (
              <div role="alert" className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  aria-label="Email Address"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-emerald-500 text-xs rounded-xl pl-9 pr-3 py-2.5 text-white outline-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                {submitting && <LoaderCircle className="w-4 h-4 animate-spin" />}
                <span>{submitting ? 'Sending…' : 'Send Reset Link'}</span>
              </button>
            </form>
          </>
        )}

        <Link href="/login" className="flex items-center justify-center gap-1 text-xs font-bold text-emerald-400 hover:underline">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Log In</span>
        </Link>
      </div>
    </div>
  );
}
