'use client';

import { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store/data-store';
import { formatDateTime, cn } from '@/lib/utils';
import { Users, UserPlus, ShieldAlert, CheckCircle2 } from 'lucide-react';
import type { Referral, UserProfile } from '@/types';

export default function ReferralsAdminPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    setReferrals(DataStore.getReferrals());
    setUsers(DataStore.getUsers());
  }, []);

  const totalRef = referrals.length;
  const rewardedRef = referrals.filter(r => r.status === 'rewarded').length;
  const pendingRef = referrals.filter(r => r.status === 'signed_up' || r.status === 'first_order_placed').length;
  const flaggedRef = referrals.filter(r => r.status === 'flagged').length;

  const toggleFlag = (ref: Referral) => {
    const updated = referrals.map(r => {
      if (r.id === ref.id) {
        return { ...r, status: r.status === 'flagged' ? 'signed_up' : 'flagged' } as Referral;
      }
      return r;
    });
    localStorage.setItem('ozeira_referrals_v1', JSON.stringify(updated));
    setReferrals(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Patron Invitations & Referrals</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Audit invitation chains, conversion milestones, and reward fulfillment.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#14151a] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3"><Users className="w-5 h-5 text-neutral-400" /><p className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">Total Referrals</p></div>
          <p className="text-2xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">{totalRef}</p>
        </div>
        <div className="bg-white dark:bg-[#14151a] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-500" /><p className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">Rewarded</p></div>
          <p className="text-2xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">{rewardedRef}</p>
        </div>
        <div className="bg-white dark:bg-[#14151a] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3"><UserPlus className="w-5 h-5 text-blue-500" /><p className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">Pending</p></div>
          <p className="text-2xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">{pendingRef}</p>
        </div>
        <div className="bg-white dark:bg-[#14151a] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex items-center gap-3"><ShieldAlert className="w-5 h-5 text-red-500" /><p className="text-neutral-500 dark:text-neutral-400 text-xs font-medium">Flagged</p></div>
          <p className="text-2xl font-bold mt-2 text-neutral-900 dark:text-neutral-100">{flaggedRef}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#14151a] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
        <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4">Referral Activity Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Referrer</th>
                <th className="py-3 px-4">Referee</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Reward</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {referrals.map(r => {
                const referrer = users.find(u => u.id === r.referrer_id);
                return (
                  <tr key={r.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-neutral-500 dark:text-neutral-400">{formatDateTime(r.created_at)}</td>
                    <td className="py-3 px-4 font-semibold text-neutral-900 dark:text-neutral-100">{r.referrer_name || referrer?.full_name || 'Atelier Patron'}</td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">{r.referee_name}</span>
                      <br /><span className="text-[11px] text-neutral-400 font-mono">{r.referee_email}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider",
                        r.status === 'rewarded' && "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
                        (r.status === 'signed_up' || r.status === 'first_order_placed') && "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300",
                        r.status === 'flagged' && "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300"
                      )}>
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-brand-amber font-bold">{r.reward_points} pts</td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => toggleFlag(r)} className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-lg px-2.5 py-1 transition-colors">
                        {r.status === 'flagged' ? 'Unflag' : 'Flag'}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {referrals.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-neutral-500 dark:text-neutral-400">No referrals found in ledger.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
