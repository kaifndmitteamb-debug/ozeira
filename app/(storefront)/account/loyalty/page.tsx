'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { DataStore } from '@/lib/store/data-store';
import { LoyaltyTransaction } from '@/types';
import { formatDateTime, formatDate } from '@/lib/utils';
import { Award, Info, Gift, TrendingUp, History, Sparkles, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoyaltyPointsPage() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const settings = DataStore.getSettings();

  useEffect(() => {
    if (user) {
      const history = DataStore.getLoyaltyLedger(user.id);
      history.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setTransactions(history);
    }
  }, [user]);

  if (!user) return null;

  const pointsValueInRupees = user.loyalty_points * (settings.loyalty.pointsToRupeeRate || 0.1);
  const formattedValue = formatAmount(pointsValueInRupees);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-1">
          Atelier Privileges & Loyalty Wallet
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Track earned points, cashback conversions, and reward redemption ledger.
        </p>
      </div>

      {/* Points Balance Card */}
      <div className="bg-gradient-to-br from-[#1a1714] via-[#2d241e] to-[#c46331] rounded-3xl shadow-luxury p-8 text-white relative overflow-hidden">
        <div className="absolute -right-10 -top-10 opacity-15 transform rotate-12 pointer-events-none">
          <Award size={220} />
        </div>
        
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Sparkles size={14} />
            <span>Available Reward Points</span>
          </div>
          <div className="flex items-baseline gap-3">
            <h2 className="text-5xl font-bold font-serif text-white">{user.loyalty_points}</h2>
            <span className="text-sm font-semibold text-stone-300">Points</span>
          </div>
          <p className="text-xs text-stone-300">
            Redemption value: <strong className="text-white text-sm">{formattedValue}</strong> off your next order.
          </p>
          
          <div className="pt-3 flex flex-wrap gap-3">
            <Link
              href="/shop"
              className="bg-white text-stone-900 px-6 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-stone-100 transition-colors shadow-sm"
            >
              Redeem at Checkout →
            </Link>
            <Link
              href="/account/referrals"
              className="bg-white/10 text-white border border-white/20 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider hover:bg-white/20 transition-colors"
            >
              Refer a Friend (+500 Pts)
            </Link>
          </div>
        </div>
      </div>

      {/* How to Earn Points Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#16171b] p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#c46331]">
            <ShoppingBag size={18} />
          </div>
          <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">Every Purchase</h3>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Earn 1 Point for every ₹10 spent across the boutique collection.
          </p>
        </div>

        <div className="bg-white dark:bg-[#16171b] p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#c46331]">
            <Award size={18} />
          </div>
          <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">Verified Reviews</h3>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Receive +100 bonus points for reviewing pieces you have ordered.
          </p>
        </div>

        <div className="bg-white dark:bg-[#16171b] p-5 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-2">
          <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#c46331]">
            <Gift size={18} />
          </div>
          <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100">Friend Referrals</h3>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Earn +500 points when your invited friends complete their first order.
          </p>
        </div>
      </div>

      {/* Transaction History Ledger */}
      <div className="bg-white dark:bg-[#16171b] rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center gap-2">
          <History size={16} className="text-[#c46331]" />
          <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">
            Points Ledger & Activity
          </h2>
        </div>

        {transactions.length > 0 ? (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100">{tx.description}</p>
                  <p className="text-[11px] text-stone-400 mt-0.5">{formatDate(tx.created_at)}</p>
                </div>
                <div className={cn(
                  "text-xs font-bold font-mono px-2.5 py-1 rounded-full",
                  tx.points > 0 
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400" 
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
                )}>
                  {tx.points > 0 ? `+${tx.points}` : tx.points} Pts
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-xs text-stone-400">
            No loyalty point transactions recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
