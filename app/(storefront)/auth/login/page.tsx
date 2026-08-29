'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowLeft, CheckCircle2, Shield, User, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';
  const { login, user, isAuthenticated, logout } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin' || user.role === 'order_manager') {
        router.push('/admin');
      } else {
        router.push(redirectUrl);
      }
    }
  }, [isAuthenticated, user, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }

    if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setError('Please enter a valid email address (e.g. patron@example.com).');
      return;
    }

    if (!password) {
      setError('Please enter your account password.');
      return;
    }

    setLoading(true);
    try {
      const { success, message, user: loggedInUser } = await login(cleanEmail, password);
      if (success && loggedInUser) {
        if (loggedInUser.role === 'admin' || loggedInUser.role === 'order_manager') {
          router.push('/admin');
        } else {
          router.push(redirectUrl);
        }
      } else {
        setError(message || 'Invalid email or password. Please verify your credentials or use Forgot Password.');
      }
    } catch (err: any) {
      setError(err?.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple') => {
    setError('');
    if (!isSupabaseConfigured) {
      setError(`Social sign-in with ${provider.toUpperCase()} requires Supabase OAuth credentials.`);
      return;
    }

    setSocialLoading(provider);
    try {
      const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${siteUrl}/auth/callback?redirect=${encodeURIComponent(redirectUrl)}`,
        },
      });

      if (authError) {
        setError(authError.message);
      }
    } catch (err: any) {
      setError(err?.message || `Failed to initiate ${provider} sign-in.`);
    } finally {
      setSocialLoading(null);
    }
  };

  if (isAuthenticated && user) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-[#0f1014] flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <Link href="/" className="inline-block mb-6 hover:opacity-80 transition-opacity">
            <span className="text-3xl font-serif tracking-widest text-[#c46331]">OZEIRA</span>
          </Link>
          <div className="bg-white dark:bg-[#1c1a17] py-8 px-6 shadow-xl sm:rounded-2xl border border-stone-200 dark:border-stone-800 transition-colors space-y-5">
            <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#c46331] mx-auto shadow-2xs">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                Already Signed In
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                You are currently signed in as <strong>{user.full_name}</strong>
              </p>
              <p className="text-xs text-stone-400 font-mono mt-0.5">{user.email}</p>
            </div>
            
            <div className="pt-3 space-y-2.5">
              <Link
                href={user.role === 'admin' || user.role === 'order_manager' ? '/admin' : redirectUrl}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-[#1a1714] hover:bg-[#c46331] transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>{user.role === 'admin' || user.role === 'order_manager' ? 'Go to Admin Dashboard' : 'Explore Boutique & Home'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
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
          Sign In to Your Atelier
        </h2>
        <p className="mt-2 text-center text-xs text-stone-500 dark:text-stone-400">
          Access your bespoke orders, wishlist, and exclusive loyalty tier
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
                  className="block w-full pl-9 pr-3 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 bg-stone-50 dark:bg-stone-900 focus:border-[#c46331] outline-none transition-colors"
                  placeholder="patron@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
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
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-stone-600 dark:text-stone-400">
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-3.5 h-3.5 rounded border-stone-300 dark:border-stone-700 text-[#c46331] focus:ring-[#c46331]"
                />
                <span>Remember me</span>
              </label>

              <Link
                href="/auth/forgot-password"
                className="font-semibold text-[#c46331] hover:text-[#a34c28] transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3 px-4 rounded-xl shadow-md text-xs font-bold uppercase tracking-wider text-white bg-[#1a1714] hover:bg-[#c46331] active:bg-[#a34c28] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#c46331] transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? 'Authenticating...' : 'Sign In to Ozeira'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-stone-200 dark:border-stone-800" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-white dark:bg-[#1c1a17] text-stone-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleSocialLogin('google')}
                disabled={socialLoading !== null}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xs bg-white dark:bg-stone-900 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    d="M12.0003 4.75C13.7703 4.75 15.3553 5.36002 16.6053 6.54998L20.0303 3.125C17.9502 1.19 15.2353 0 12.0003 0C7.31028 0 3.25527 2.69 1.28027 6.60998L5.27028 9.70498C6.21525 6.86002 8.87028 4.75 12.0003 4.75Z"
                    fill="#EA4335"
                  />
                  <path
                    d="M23.49 12.275C23.49 11.49 23.415 10.73 23.3 10H12V14.51H18.47C18.18 15.99 17.34 17.25 16.08 18.1L19.945 21.1C22.2 19.01 23.49 15.92 23.49 12.275Z"
                    fill="#4285F4"
                  />
                  <path
                    d="M5.26498 14.2949C5.02498 13.5699 4.88501 12.7999 4.88501 11.9999C4.88501 11.1999 5.01998 10.4299 5.26498 9.7049L1.275 6.60986C0.46 8.22986 0 10.0599 0 11.9999C0 13.9399 0.46 15.7699 1.28 17.3899L5.26498 14.2949Z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12.0004 24.0001C15.2404 24.0001 17.9654 22.935 19.9454 21.095L16.0804 18.095C15.0054 18.82 13.6204 19.245 12.0004 19.245C8.8704 19.245 6.21537 17.135 5.26538 14.29L1.27539 17.385C3.25539 21.31 7.3104 24.0001 12.0004 24.0001Z"
                    fill="#34A853"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('apple')}
                disabled={socialLoading !== null}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 border border-stone-200 dark:border-stone-700 rounded-xl shadow-2xs bg-white dark:bg-stone-900 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                <svg className="h-4 w-4 fill-current text-stone-900 dark:text-stone-100" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.57.65-1.06 1.72-.93 2.74 1 .08 2.01-.49 2.63-1.24z"/>
                </svg>
                <span>Apple</span>
              </button>
            </div>
          </div>
          
          <div className="mt-8 text-center text-xs">
            <span className="text-stone-500">Don't have an account yet? </span>
            <Link href="/auth/signup" className="font-bold text-[#c46331] hover:text-[#a34c28] transition-colors">
              Create Atelier Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center bg-stone-50 dark:bg-black">
        <div className="w-8 h-8 border-2 border-[#c46331] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginFormContent />
    </Suspense>
  );
}
