'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { useWishlist } from '@/lib/context/WishlistContext';
import { DataStore } from '@/lib/store/data-store';
import { Order, Referral } from '@/types';
import { ShoppingBag, Award, Heart, Users, ChevronRight, ArrowRight, Truck } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function AccountOverviewPage() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const { count: wishlistCount } = useWishlist();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [referrals, setReferrals] = useState<Referral[]>([]);

  useEffect(() => {
    if (user) {
      const userOrders = DataStore.getOrders().filter(o => o.user_id === user.id);
      userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOrders(userOrders);
      
      const userReferrals = DataStore.getReferrals(user.id);
      setReferrals(userReferrals);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="bg-white dark:bg-[#16171b] rounded-3xl p-8 h-32 border border-stone-200 dark:border-stone-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-[#16171b] rounded-2xl p-5 h-28 border border-stone-200 dark:border-stone-800" />
          ))}
        </div>
      </div>
    );
  }

  const recentOrders = orders.slice(0, 3);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300';
      case 'confirmed': return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300';
      case 'shipped': return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300';
      case 'out_for_delivery': return 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300';
      case 'delivered': return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300';
      case 'cancelled': return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300';
      case 'returned': return 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-300';
      default: return 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white dark:bg-[#16171b] rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 p-6 md:p-8">
        <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-1">
          Welcome back, {user.full_name}!
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Manage your bespoke orders, luxury wishlist, and loyalty benefits from your atelier portal.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#16171b] p-5 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#c46331] shrink-0">
            <ShoppingBag size={20} />
          </div>
          <div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wider">Total Orders</p>
            <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{orders.length}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#16171b] p-5 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#c46331] shrink-0">
            <Award size={20} />
          </div>
          <div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wider">Loyalty Points</p>
            <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{user.loyalty_points}</p>
          </div>
        </div>
        
        <div className="bg-white dark:bg-[#16171b] p-5 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center text-rose-600 shrink-0">
            <Heart size={20} />
          </div>
          <div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wider">Wishlist Items</p>
            <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{wishlistCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16171b] p-5 rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 flex items-center gap-4">
          <div className="w-11 h-11 rounded-2xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 shrink-0">
            <Users size={20} />
          </div>
          <div>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 font-semibold uppercase tracking-wider">Referrals</p>
            <p className="text-xl font-bold text-stone-900 dark:text-stone-100">{referrals.length}</p>
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white dark:bg-[#16171b] rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
        <div className="p-6 flex items-center justify-between border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
            Recent Orders
          </h2>
          <Link
            href="/account/orders"
            className="text-xs font-bold uppercase tracking-wider text-[#c46331] dark:text-amber-400 hover:underline flex items-center gap-1"
          >
            <span>View All Orders</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {recentOrders.length > 0 ? (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                      #{order.order_number}
                    </span>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusBadge(order.status))}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-stone-400 mt-1">
                    {formatDate(order.created_at)} • {order.items.length} item(s)
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-bold text-stone-900 dark:text-stone-100">
                    {formatAmount(order.total_amount)}
                  </span>
                  <Link
                    href={`/track-order?orderNumber=${order.order_number}&email=${encodeURIComponent(user.email)}`}
                    className="px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-[#c46331] hover:text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                  >
                    <Truck size={13} />
                    <span>Track</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="w-10 h-10 text-stone-300 dark:text-stone-700 mx-auto" />
            <p className="text-xs text-stone-500 dark:text-stone-400">No orders placed yet.</p>
            <Link
              href="/shop"
              className="inline-block px-6 py-2.5 bg-[#1a1714] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#c46331] transition-colors"
            >
              Explore Boutique Collection →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
