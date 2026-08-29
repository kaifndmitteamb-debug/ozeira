'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { DataStore } from '@/lib/store/data-store';
import { Referral } from '@/types';
import { formatDate } from '@/lib/utils';
import { Share2, Copy, CheckCircle2, Users, Gift, Mail, MessageCircle, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function ReferralsPage() {
  const { user } = useAuth();
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [copied, setCopied] = useState(false);
  const settings = DataStore.getSettings();

  useEffect(() => {
    if (user) {
      const data = DataStore.getReferrals(user.id);
      data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setReferrals(data);
    }
  }, [user]);

  if (!user) return null;

  const referralUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/auth/signup?ref=${user.referral_code}`
    : `https://ozeira.com/auth/signup?ref=${user.referral_code}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareText = `Discover bespoke luxury at Ozeira. Sign up with my link to claim ₹500 off your first handcrafted creation: ${referralUrl}`;

  const totalReferrals = referrals.length;
  const rewardedReferrals = referrals.filter(r => r.status === 'rewarded').length;
  const pendingReferrals = totalReferrals - rewardedReferrals;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-1">
          Refer & Earn Privileges
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Share your love for Ozeira craftsmanship and earn reward points for every invited patron.
        </p>
      </div>

      <div className="bg-white dark:bg-[#16171b] rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="bg-amber-50/50 dark:bg-amber-950/20 p-8 md:p-10 text-center border-b border-stone-100 dark:border-stone-800">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-950/60 text-[#c46331] rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-xs">
            <Gift size={26} />
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-2">
            Give ₹500, Earn {settings.loyalty?.referralBonusPoints || 500} Points
          </h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
            Invite your friends to the Ozeira atelier. They unlock ₹500 off their first order, and you earn {settings.loyalty?.referralBonusPoints || 500} points when their order is fulfilled.
          </p>
        </div>

        {/* Share Referral Link Input */}
        <div className="p-6 md:p-8 space-y-6">
          <div className="max-w-xl mx-auto space-y-2">
            <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300">
              Your Exclusive Invitation Link
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={referralUrl}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs font-mono text-stone-900 dark:text-stone-100 focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-5 py-2.5 bg-[#1a1714] dark:bg-stone-800 hover:bg-[#c46331] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {copied ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="flex justify-center gap-3">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <MessageCircle size={14} />
              <span>Share on WhatsApp</span>
            </a>
            <a
              href={`mailto:?subject=An invitation to Ozeira Atelier&body=${encodeURIComponent(shareText)}`}
              className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors"
            >
              <Mail size={14} />
              <span>Email Friend</span>
            </a>
          </div>
        </div>
      </div>

      {/* Referral Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#16171b] p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm text-center">
          <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Total Invited</p>
          <p className="text-2xl font-bold text-stone-900 dark:text-stone-100 mt-1">{totalReferrals}</p>
        </div>
        <div className="bg-white dark:bg-[#16171b] p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm text-center">
          <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Orders Completed</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{rewardedReferrals}</p>
        </div>
        <div className="bg-white dark:bg-[#16171b] p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm text-center">
          <p className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Points Earned</p>
          <p className="text-2xl font-bold text-[#c46331] dark:text-amber-400 mt-1">
            {rewardedReferrals * (settings.loyalty?.referralBonusPoints || 500)}
          </p>
        </div>
      </div>

      {/* Referral Activity List */}
      <div className="bg-white dark:bg-[#16171b] rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
          <Users size={16} className="text-[#c46331]" />
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Invited Patrons History
          </h2>
        </div>

        {referrals.length > 0 ? (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {referrals.map((ref) => (
              <div key={ref.id} className="p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">{ref.referee_email}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">Invited on {formatDate(ref.created_at)}</p>
                </div>
                <span className={cn(
                  "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  ref.status === 'rewarded' 
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" 
                    : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"
                )}>
                  {ref.status === 'rewarded' ? 'Reward Granted (+500 Pts)' : 'Pending Order'}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-stone-400">
            No friends invited yet. Share your link above to start earning rewards!
          </div>
        )}
      </div>
    </div>
  );
}
