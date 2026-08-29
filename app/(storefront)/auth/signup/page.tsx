'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Mail, Lock, Eye, EyeOff, User, Phone, Tag, AlertCircle, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

function SignupFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const { signup, user, isAuthenticated, logout } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [agreed, setAgreed] = useState(false);
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin' || user.role === 'order_manager') {
        router.push('/admin');
      } else {
        router.push(redirectUrl);
      }
    }
  }, [isAuthenticated, user, router, redirectUrl]);

  // Auto-populate referral code from URL query param (e.g. ?ref=KAIF777)
  useEffect(() => {
    const refParam = searchParams.get('ref');
    if (refParam) {
      setReferralCode(refParam.toUpperCase());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanName = fullName.trim();
    const cleanEmail = email.trim();
    const cleanPhone = phone.trim();
    const cleanRef = referralCode.trim().toUpperCase();

    if (!cleanName) {
      setError('Please enter your full name.');
      return;
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your confirmation password.');
      return;
    }

    if (!agreed) {
      setError('Please accept the Ozeira Terms & Conditions and Privacy Policy to proceed.');
      return;
    }

    setLoading(true);
    try {
      const { success, message } = await signup(
        cleanEmail,
        password,
        cleanName,
        cleanPhone || undefined,
        cleanRef || undefined
      );

      if (success) {
        router.push(redirectUrl);
      } else {
        setError(message || 'Failed to create account. Please check your details and try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred during signup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#0f1014] flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
            <span className="text-3xl font-serif tracking-widest text-[#c46331]">OZEIRA</span>
          </Link>
          <div className="bg-white dark:bg-[#1c1a17] py-8 px-6 shadow-xl sm:rounded-2xl border border-stone-200 dark:border-stone-800 transition-colors space-y-5">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#c46331] mx-auto shadow-2xs">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                Already Signed In
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                You already have an active session as <strong>{user.full_name}</strong>
              </p>
              <p className="text-xs text-stone-400 font-mono mt-0.5">{user.email}</p>
            </div>
            
            <div className="pt-3 space-y-2.5">
              <Link
                href={user.role === 'admin' || user.role === 'order_manager' ? '/admin' : '/'}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#1a1714] hover:bg-[#c46331] transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>{user.role === 'admin' || user.role === 'order_manager' ? 'Go to Admin Dashboard' : 'Explore Boutique & Home'}</span>
              </Link>
              <button
                onClick={() => logout()}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-all cursor-pointer"
              >
                Sign Out from Current Session
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#0f1014] flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex justify-center items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
          <span className="text-3xl font-serif tracking-widest text-[#c46331]">OZEIRA</span>
        </Link>
        <h2 className="text-center text-2xl sm:text-3xl font-serif text-stone-900 dark:text-stone-100">
          Create an Atelier Account
        </h2>
        <p className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
          Join Ozeira to unlock bespoke wishlist, order tracking, and rewards
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#1c1a17] py-8 px-6 shadow-xl sm:rounded-2xl border border-stone-200 dark:border-stone-800 transition-colors">
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 p-3.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-start gap-2.5 animate-shake">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">{error}</div>
              </div>
            )}
            
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 focus:border-[#c46331] outline-none transition-colors"
                  placeholder="Kavya Sharma"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Email Address <span className="text-rose-500">*</span>
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
                  className="block w-full pl-9 pr-3 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 focus:border-[#c46331] outline-none transition-colors"
                  placeholder="kavya@example.com"
                />
              </div>
            </div>

            {/* Phone Number (Optional) */}
            <div>
              <label htmlFor="phone" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Phone Number <span className="text-stone-400 font-normal">(Optional - For Order SMS Updates)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 focus:border-[#c46331] outline-none transition-colors"
                  placeholder="+91 98765 43210 (optional)"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Password <span className="text-rose-500">*</span>
                </label>
                {password.length > 0 && password.length < 6 && (
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Min 6 characters</span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-10 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 focus:border-[#c46331] outline-none transition-colors"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="confirmPassword" className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                {passwordsMatch && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Passwords match
                  </span>
                )}
                {passwordsMismatch && (
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                    Passwords do not match
                  </span>
                )}
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={cn(
                    "block w-full pl-9 pr-10 py-2.5 border rounded-xl text-xs text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 outline-none transition-colors",
                    passwordsMismatch
                      ? "border-rose-400 focus:border-rose-500"
                      : passwordsMatch
                      ? "border-emerald-500 focus:border-emerald-500"
                      : "border-stone-200 dark:border-stone-700 focus:border-[#c46331]"
                  )}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Referral Code (Optional) */}
            <div>
              <label htmlFor="referralCode" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Referral / Invitation Code <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Tag className="h-4 w-4" />
                </div>
                <input
                  id="referralCode"
                  name="referralCode"
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="block w-full pl-9 pr-3 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono font-bold tracking-wider text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 focus:border-[#c46331] outline-none transition-colors"
                  placeholder="e.g. OZ-KAIF77"
                />
              </div>
              {referralCode.trim().length > 0 && (
                <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 flex items-center gap-1 font-medium">
                  <Sparkles className="w-3 h-3 text-[#c46331]" />
                  <span>Referral applied! You will earn 500 bonus reward points on your first purchase.</span>
                </p>
              )}
            </div>

            {/* Terms Agreement */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="agreed"
                name="agreed"
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded border-stone-300 dark:border-stone-700 text-[#c46331] focus:ring-[#c46331] cursor-pointer"
              />
              <label htmlFor="agreed" className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed cursor-pointer">
                I agree to the{' '}
                <Link href="/policy/terms" target="_blank" className="font-semibold text-[#c46331] hover:underline">
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link href="/policy/privacy" target="_blank" className="font-semibold text-[#c46331] hover:underline">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl shadow-md text-xs font-bold uppercase tracking-wider text-white bg-[#1a1714] hover:bg-[#c46331] active:bg-[#a34c28] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c46331] transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? 'Creating Atelier Account...' : 'Create Atelier Account'}
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center text-xs">
            <span className="text-stone-500">Already registered with Ozeira? </span>
            <Link href="/auth/login" className="font-bold text-[#c46331] hover:text-[#a34c28] transition-colors">
              Sign in to account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center bg-stone-50 dark:bg-black">
        <div className="w-8 h-8 border-2 border-[#c46331] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SignupFormContent />
    </Suspense>
  );
}
