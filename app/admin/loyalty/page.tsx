'use client';

import { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store/data-store';
import { useStore } from '@/lib/context/StoreContext';
import { cn, formatDateTime } from '@/lib/utils';
import { Award, Users, ArrowRightLeft, Gift, Search, Plus } from 'lucide-react';
import type { LoyaltyTransaction, UserProfile } from '@/types';

export default function LoyaltyAdminPage() {
  const { settings } = useStore();
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filterType, setFilterType] = useState('all');

  const [showAdjust, setShowAdjust] = useState(false);
  const [adjUser, setAdjUser] = useState('');
  const [adjPoints, setAdjPoints] = useState(0);
  const [adjReason, setAdjReason] = useState('');

  useEffect(() => {
    setTransactions(DataStore.getLoyaltyLedger());
    setUsers(DataStore.getUsers());
  }, []);

  const totalIssued = transactions.filter(t => t.points > 0).reduce((sum, t) => sum + t.points, 0);
  const totalRedeemed = transactions.filter(t => t.points < 0).reduce((sum, t) => sum + Math.abs(t.points), 0);
  const activeMembers = users.filter(u => u.loyalty_points > 0).length;

  const filtered = filterType === 'all' ? transactions : transactions.filter(t => t.type === filterType);

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjUser || !adjPoints || !adjReason) return;
    DataStore.addLoyaltyTransaction({
      user_id: adjUser,
      points: Number(adjPoints),
      type: 'manual_adjust' as any,
      description: adjReason
    });
    setTransactions(DataStore.getLoyaltyLedger());
    setUsers(DataStore.getUsers());
    setShowAdjust(false);
    setAdjUser(''); setAdjPoints(0); setAdjReason('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Patron Loyalty & Rewards</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage points ledger, redemption parameters, and balance adjustments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#14151a] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-brand-amber/10 text-brand-amber rounded-xl"><Award className="w-6 h-6" /></div>
          <div><p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Total Points Issued</p><p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalIssued.toLocaleString()}</p></div>
        </div>
        <div className="bg-white dark:bg-[#14151a] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl"><Gift className="w-6 h-6" /></div>
          <div><p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Total Points Redeemed</p><p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{totalRedeemed.toLocaleString()}</p></div>
        </div>
        <div className="bg-white dark:bg-[#14151a] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl"><Users className="w-6 h-6" /></div>
          <div><p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Active Patrons</p><p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{activeMembers}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4 bg-white dark:bg-[#14151a] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">Ledger History</h2>
            <select className="border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-brand-amber" value={filterType} onChange={e=>setFilterType(e.target.value)}>
              <option value="all">All Types</option>
              <option value="earned_purchase">Earned Purchase</option>
              <option value="earned_review">Earned Review</option>
              <option value="earned_referral">Earned Referral</option>
              <option value="earned_signup">Earned Signup</option>
              <option value="redeemed_order">Redeemed Order</option>
              <option value="manual_adjust">Manual Adjust</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Patron</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filtered.map(t => {
                  const user = users.find(u => u.id === t.user_id);
                  return (
                    <tr key={t.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap text-neutral-500 dark:text-neutral-400">{formatDateTime(t.created_at)}</td>
                      <td className="py-3 px-4 font-medium text-neutral-900 dark:text-neutral-100">{user?.full_name || 'Anonymous Patron'}</td>
                      <td className="py-3 px-4">
                        <span className="bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded text-[11px] font-mono">{t.type}</span>
                      </td>
                      <td className="py-3 px-4 text-neutral-600 dark:text-neutral-400 max-w-xs truncate" title={t.description}>{t.description}</td>
                      <td className={cn("py-3 px-4 text-right font-bold", t.points > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500')}>
                        {t.points > 0 ? '+' : ''}{t.points}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-8 text-neutral-500 dark:text-neutral-400">No transactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-[#14151a] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm text-xs">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4">Program Rules</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <span className="text-neutral-500 dark:text-neutral-400">Status</span>
                <span className={cn("font-semibold", settings.loyalty.isEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-red-500")}>
                  {settings.loyalty.isEnabled ? "Active" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <span className="text-neutral-500 dark:text-neutral-400">Earn Rate</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{settings.loyalty.pointsPerRupeeSpent} pts / ₹1</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <span className="text-neutral-500 dark:text-neutral-400">Redemption Value</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">₹{settings.loyalty.pointsToRupeeRate} / pt</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <span className="text-neutral-500 dark:text-neutral-400">Min Redemption</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{settings.loyalty.minPointsToRedeem} pts</span>
              </div>
              <div className="flex justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                <span className="text-neutral-500 dark:text-neutral-400">Signup Bonus</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{settings.loyalty.signupBonusPoints} pts</span>
              </div>
            </div>
            <p className="text-[11px] text-neutral-400 mt-4 italic">Configure live parameters inside Store Settings.</p>
          </div>

          <div className="bg-white dark:bg-[#14151a] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm text-xs">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-brand-amber" /> Manual Balance Adjustment</h2>
            {showAdjust ? (
              <form onSubmit={handleAdjust} className="space-y-3">
                <div>
                  <label className="text-neutral-600 dark:text-neutral-400 font-medium block mb-1">Select Patron</label>
                  <select required className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-2 rounded-lg text-xs outline-none focus:border-brand-amber" value={adjUser} onChange={e=>setAdjUser(e.target.value)}>
                    <option value="">-- Choose User --</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-neutral-600 dark:text-neutral-400 font-medium block mb-1">Points (negative values deduct)</label>
                  <input required type="number" className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-2 rounded-lg text-xs outline-none focus:border-brand-amber" value={adjPoints} onChange={e=>setAdjPoints(Number(e.target.value))} />
                </div>
                <div>
                  <label className="text-neutral-600 dark:text-neutral-400 font-medium block mb-1">Audit Reason</label>
                  <input required type="text" className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 p-2 rounded-lg text-xs outline-none focus:border-brand-amber" placeholder="e.g. Atelier compensation for delay" value={adjReason} onChange={e=>setAdjReason(e.target.value)} />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" className="flex-1 bg-brand-amber hover:bg-brand-amber-dark text-white py-2 rounded-lg text-xs font-semibold transition-colors">Save</button>
                  <button type="button" onClick={() => setShowAdjust(false)} className="flex-1 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 py-2 rounded-lg text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">Cancel</button>
                </div>
              </form>
            ) : (
              <button onClick={() => setShowAdjust(true)} className="w-full border border-dashed border-neutral-300 dark:border-neutral-700 py-3 rounded-xl text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-900/50 flex items-center justify-center gap-2 transition-colors">
                <Plus className="w-4 h-4" /> Add Manual Adjustment
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
