'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store/data-store';
import { useStore } from '@/lib/context/StoreContext';
import { cn, formatDate } from '@/lib/utils';
import { UserProfile, UserRole } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { 
  Search, 
  ChevronDown, 
  CheckCircle, 
  XCircle, 
  ShieldBan, 
  ShieldCheck, 
  UserCheck, 
  ShieldAlert, 
  Sparkles,
  ShoppingBag,
  Gift,
  Mail,
  Phone,
  User,
  Shield,
  Trash2
} from 'lucide-react';

interface CustomerWithStats extends UserProfile {
  ordersCount: number;
  totalSpent: number;
}

export default function CustomersManagementPage() {
  const [customers, setCustomers] = useState<CustomerWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'orders' | 'points' | 'spent'>('newest');
  const [expandedCustomerId, setExpandedCustomerId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<CustomerWithStats | null>(null);

  const { refreshData } = useStore();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    setLoading(true);
    let users = DataStore.getUsers();

    // Fetch live profiles directly from Supabase
    if (isSupabaseConfigured) {
      try {
        const { data: profData } = await supabase.from('profiles').select('*');
        if (profData && profData.length > 0) {
          const userMap = new Map<string, UserProfile>();
          users.forEach((u) => userMap.set(u.id, u));
          profData.forEach((p) => userMap.set(p.id, p));
          users = Array.from(userMap.values());
        }
      } catch (err) {
        console.error('Error fetching Supabase profiles:', err);
      }
    }

    const orders = DataStore.getOrders();

    // Extract all guest shoppers from orders as customers if not already registered
    const userEmails = new Set(users.map((u) => u.email.toLowerCase().trim()));
    const guestCustomers: UserProfile[] = [];

    orders.forEach((order) => {
      const email = (order.guest_email || '').toLowerCase().trim();
      if (email && !userEmails.has(email)) {
        userEmails.add(email);
        guestCustomers.push({
          id: `guest-${email}`,
          email: order.guest_email || email,
          full_name: order.user_name || order.shipping_address?.full_name || 'Guest Shopper',
          phone: order.guest_phone || order.shipping_address?.phone || undefined,
          role: 'customer',
          loyalty_points: 0,
          referral_code: '',
          is_blocked: false,
          created_at: order.created_at,
        });
      }
    });

    const allUsers = [...users, ...guestCustomers];

    const customersWithStats = allUsers.map((user) => {
      const isStaff = user.role === 'admin' || user.role === 'order_manager';
      const userOrders = isStaff
        ? []
        : orders.filter(
            (o) =>
              o.user_id === user.id ||
              (o.guest_email && o.guest_email.toLowerCase() === user.email.toLowerCase())
          );
      const totalSpent = userOrders.reduce(
        (sum, o) => sum + (o.payment_status === 'paid' ? o.total_amount : 0),
        0
      );

      return {
        ...user,
        loyalty_points: isStaff ? 0 : user.loyalty_points,
        ordersCount: userOrders.length,
        totalSpent,
      };
    });

    setCustomers(customersWithStats);
    setLoading(false);
  };

  const handleRoleChange = async (customer: CustomerWithStats, newRole: UserRole) => {
    const updatedUser: UserProfile = {
      ...customer,
      role: newRole,
      loyalty_points: newRole === 'customer' ? (customer.loyalty_points || 250) : 0,
    };
    delete (updatedUser as any).ordersCount;
    delete (updatedUser as any).totalSpent;
    DataStore.saveUser(updatedUser);

    if (isSupabaseConfigured) {
      await supabase.from('profiles').update({ role: newRole, loyalty_points: updatedUser.loyalty_points }).eq('id', customer.id);
    }

    refreshData();
    await loadCustomers();
  };

  const handleToggleBlock = async (customer: CustomerWithStats) => {
    const updatedUser = { ...customer };
    delete (updatedUser as any).ordersCount;
    delete (updatedUser as any).totalSpent;
    updatedUser.is_blocked = !updatedUser.is_blocked;
    DataStore.saveUser(updatedUser);

    if (isSupabaseConfigured) {
      await supabase.from('profiles').update({ is_blocked: updatedUser.is_blocked }).eq('id', customer.id);
    }

    refreshData();
    await loadCustomers();
  };

  const handleToggleCodBlock = async (customer: CustomerWithStats) => {
    const updatedUser = { ...customer };
    delete (updatedUser as any).ordersCount;
    delete (updatedUser as any).totalSpent;
    updatedUser.cod_blocked = !updatedUser.cod_blocked;
    DataStore.saveUser(updatedUser);

    if (isSupabaseConfigured) {
      await supabase.from('profiles').update({ cod_blocked: updatedUser.cod_blocked }).eq('id', customer.id);
    }

    refreshData();
    await loadCustomers();
  };

  const handleDeleteCustomer = async (customer: CustomerWithStats) => {
    if (customer.role === 'admin') {
      alert('Primary administrator accounts cannot be deleted.');
      return;
    }
    DataStore.deleteUser(customer.id);
    setShowDeleteConfirm(null);
    refreshData();
    await loadCustomers();
  };

  const filteredCustomers = customers
    .filter((c) => {
      const matchesRole = roleFilter === 'all' || c.role === roleFilter;
      const matchesSearch =
        c.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.phone || '').includes(searchQuery);
      return matchesRole && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'orders') return b.ordersCount - a.ordersCount;
      if (sortBy === 'points') return b.loyalty_points - a.loyalty_points;
      if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 font-serif">
            User Directory & Staff Management
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
            Manage patrons, assign staff roles (admin / order manager), view spend & loyalty history
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#14151a] rounded-2xl shadow-xs border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-stone-50/50 dark:bg-stone-900/30">
          <div className="flex flex-wrap items-center gap-3">
            {/* Role Filter Tabs */}
            <div className="flex items-center space-x-1.5 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl">
              {(['all', 'customer', 'order_manager', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={cn(
                    'px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg transition-all',
                    roleFilter === r
                      ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-2xs'
                      : 'text-stone-500 hover:text-stone-900 dark:hover:text-stone-200'
                  )}
                >
                  {r === 'all' ? 'All Users' : r.replace('_', ' ')}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-stone-500">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-stone-100 dark:bg-stone-800 border-none rounded-lg px-2.5 py-1 text-xs font-medium text-stone-900 dark:text-stone-100 outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="orders">Most Orders</option>
                <option value="spent">Highest Spend</option>
                <option value="points">Most Loyalty Points</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
            <input
              type="text"
              placeholder="Search name, email, phone..."
              className="w-full pl-9 pr-4 py-1.5 border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 text-xs rounded-xl text-stone-900 dark:text-stone-100 focus:border-[#c46331] outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-stone-100 dark:bg-stone-800/50 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-stone-400">
            No patrons or staff found matching the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-stone-50 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-800 text-stone-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">User</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Orders & Spend</th>
                  <th className="px-6 py-3.5">Points</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Joined</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                {filteredCustomers.map((customer) => {
                  const isStaff = customer.role === 'admin' || customer.role === 'order_manager';

                  return (
                    <React.Fragment key={customer.id}>
                      <tr className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30 transition-colors">
                        {/* User Identity */}
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-stone-200 dark:bg-stone-700 flex items-center justify-center font-bold text-stone-600 dark:text-stone-300 mr-3 text-xs overflow-hidden">
                              {customer.avatar_url ? (
                                <img src={customer.avatar_url} alt="" className="h-full w-full object-cover" />
                              ) : (
                                customer.full_name?.charAt(0) || 'U'
                              )}
                            </div>
                            <div>
                              <div className="font-semibold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                                <span>{customer.full_name || 'Guest User'}</span>
                                {customer.role === 'admin' && (
                                  <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300">
                                    Owner
                                  </span>
                                )}
                              </div>
                              <div className="text-stone-500 text-xs">{customer.email}</div>
                            </div>
                          </div>
                        </td>

                        {/* Role Select Dropdown */}
                        <td className="px-6 py-4">
                          <select
                            value={customer.role}
                            onChange={(e) => handleRoleChange(customer, e.target.value as UserRole)}
                            className={cn(
                              "px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer",
                              customer.role === 'admin'
                                ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800"
                                : customer.role === 'order_manager'
                                ? "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800"
                                : "bg-stone-100 text-stone-800 border-stone-200 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700"
                            )}
                          >
                            <option value="customer">Customer</option>
                            <option value="order_manager">Order Manager</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>

                        {/* Orders & Spend */}
                        <td className="px-6 py-4">
                          {isStaff ? (
                            <span className="text-stone-400 dark:text-stone-600 font-medium">— (Staff)</span>
                          ) : (
                            <>
                              <div className="font-semibold text-stone-900 dark:text-stone-100">{customer.ordersCount} Orders</div>
                              <div className="text-stone-500 text-xs">₹{customer.totalSpent.toLocaleString()}</div>
                            </>
                          )}
                        </td>

                        {/* Loyalty Points */}
                        <td className="px-6 py-4 font-bold text-[#c46331]">
                          {isStaff ? (
                            <span className="text-stone-400 dark:text-stone-600 font-normal">—</span>
                          ) : (
                            customer.loyalty_points
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col gap-1">
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-xs font-medium flex items-center w-fit",
                              customer.is_blocked ? "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                            )}>
                              {customer.is_blocked ? "Account Blocked" : "Active"}
                            </span>
                            {customer.cod_blocked && !isStaff && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300 flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> COD Disabled
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Joined Date */}
                        <td className="px-6 py-4 text-stone-500">{formatDate(customer.created_at)}</td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            {!isStaff && (
                              <button
                                onClick={() => setExpandedCustomerId(expandedCustomerId === customer.id ? null : customer.id)}
                                className="text-[#c46331] hover:underline text-xs font-medium cursor-pointer"
                              >
                                {expandedCustomerId === customer.id ? 'Close' : 'View Ledger'}
                              </button>
                            )}

                            {!isStaff && (
                              <button
                                onClick={() => handleToggleCodBlock(customer)}
                                title={customer.cod_blocked ? "Allow COD" : "Block COD"}
                                className={cn(
                                  "p-1.5 rounded-lg text-white transition-colors cursor-pointer",
                                  customer.cod_blocked ? "bg-amber-600 hover:bg-amber-700" : "bg-stone-600 hover:bg-stone-700"
                                )}
                              >
                                <ShieldAlert className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {customer.role !== 'admin' && (
                              <button
                                onClick={() => handleToggleBlock(customer)}
                                title={customer.is_blocked ? "Unblock Account" : "Block Account"}
                                className={cn(
                                  "p-1.5 rounded-lg text-white transition-colors cursor-pointer",
                                  customer.is_blocked ? "bg-emerald-600 hover:bg-emerald-700" : "bg-stone-600 hover:bg-stone-700"
                                )}
                              >
                                {customer.is_blocked ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldBan className="w-3.5 h-3.5" />}
                              </button>
                            )}

                            {customer.role !== 'admin' && (
                              <button
                                onClick={() => setShowDeleteConfirm(customer)}
                                title="Delete Customer Account"
                                className="p-1.5 rounded-lg text-white bg-rose-600 hover:bg-rose-700 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Loyalty Ledger Sub-drawer */}
                      {expandedCustomerId === customer.id && !isStaff && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-stone-50/50 dark:bg-stone-900/40 border-b border-stone-200 dark:border-stone-800">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-700 pb-2 mb-3">
                                  Customer Metadata
                                </h4>
                                <div className="space-y-2 text-xs">
                                  <div className="flex"><span className="w-32 text-stone-500">User ID:</span> <span className="font-mono text-stone-900 dark:text-stone-200">{customer.id}</span></div>
                                  <div className="flex"><span className="w-32 text-stone-500">Full Name:</span> <span className="font-medium text-stone-900 dark:text-stone-200">{customer.full_name}</span></div>
                                  <div className="flex"><span className="w-32 text-stone-500">Email:</span> <span className="text-stone-900 dark:text-stone-200">{customer.email}</span></div>
                                  <div className="flex"><span className="w-32 text-stone-500">Phone:</span> <span className="text-stone-900 dark:text-stone-200">{customer.phone || 'Not provided'}</span></div>
                                  <div className="flex"><span className="w-32 text-stone-500">Referral Code:</span> <span className="font-mono font-bold text-amber-600">{customer.referral_code || 'None'}</span></div>
                                </div>
                              </div>

                              <div>
                                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 border-b border-stone-200 dark:border-stone-700 pb-2 mb-3">
                                  Loyalty Points Ledger
                                </h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 text-xs">
                                  {DataStore.getLoyaltyLedger(customer.id).length === 0 ? (
                                    <div className="text-stone-400 py-2">No loyalty transactions recorded yet.</div>
                                  ) : (
                                    DataStore.getLoyaltyLedger(customer.id).map((tx) => (
                                      <div key={tx.id} className="flex justify-between items-center py-1.5 border-b border-stone-100 dark:border-stone-800">
                                        <div>
                                          <div className="font-medium text-stone-900 dark:text-stone-200">{tx.description}</div>
                                          <div className="text-[10px] text-stone-400">{formatDate(tx.created_at)}</div>
                                        </div>
                                        <div className={cn("font-bold", tx.points > 0 ? "text-emerald-600" : "text-rose-600")}>
                                          {tx.points > 0 ? `+${tx.points}` : tx.points} pts
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" 
          onClick={() => setShowDeleteConfirm(null)}
        >
          <div 
            className="bg-white dark:bg-[#14151a] text-neutral-900 dark:text-neutral-100 rounded-2xl border border-neutral-200 dark:border-neutral-800 max-w-sm w-full p-6 shadow-2xl animate-scale-in" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/40 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-center">Delete Customer Account?</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 text-center mt-2">
              Are you sure you want to permanently remove <strong>{showDeleteConfirm.full_name}</strong> ({showDeleteConfirm.email})? This action cannot be undone.
            </p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteCustomer(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
