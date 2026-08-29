'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured) {
        const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${siteUrl}/auth/reset-password`,
        });

        if (resetError) {
          setError(resetError.message);
          setLoading(false);
          return;
        }
      }

      setLoading(false);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'Failed to dispatch password reset. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0f1014] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
          <span className="text-3xl font-serif tracking-widest text-[#c46331]">OZEIRA</span>
        </Link>
        <h2 className="mt-4 text-center text-2xl sm:text-3xl font-serif text-stone-900 dark:text-stone-100">
          Reset Password
        </h2>
        <p className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
          Enter your registered email to receive a password reset link.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#1c1a17] py-8 px-6 shadow-xl sm:rounded-2xl border border-stone-200 dark:border-stone-800">
          {submitted ? (
            <div className="text-center space-y-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-stone-100">Check your email</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                We have sent a secure password reset link to <strong className="text-stone-900 dark:text-stone-200">{email}</strong>. Please click the link in your inbox to set a new password.
              </p>
              <Link
                href="/auth/login"
                className="w-full inline-flex justify-center py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#c46331] hover:bg-[#a34c28] transition-all shadow-md mt-2"
              >
                Return to Login
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 border border-rose-200 dark:border-rose-900/60">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 focus:border-[#c46331] outline-none"
                    placeholder="patron@example.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#1a1714] hover:bg-[#c46331] active:bg-[#a34c28] transition-all shadow-md disabled:opacity-50 mt-2"
              >
                {loading ? 'Dispatching Reset Link...' : 'Send Reset Link'}
              </button>

              <div className="text-center pt-2">
                <Link
                  href="/auth/login"
                  className="inline-flex items-center gap-1 text-xs font-medium text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back to Login</span>
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
