'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { DataStore } from '@/lib/store/data-store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Order, OrderStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { Package, Search, Truck, ExternalLink, FileText, RotateCcw } from 'lucide-react';
import { RequestReturnModal } from '@/components/account/RequestReturnModal';

export default function OrdersPage() {
  const { user } = useAuth();
  const { formatAmount } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<OrderStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [selectedReturnOrder, setSelectedReturnOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    if (!user) return;
    const userEmail = user.email?.toLowerCase();
    let userOrders = DataStore.getOrders().filter(
      o => o.user_id === user.id || (userEmail && o.guest_email?.toLowerCase() === userEmail)
    );

    if (isSupabaseConfigured) {
      try {
        const { data: dbOrders } = await supabase
          .from('orders')
          .select('*')
          .or(`user_id.eq.${user.id},guest_email.ilike.${userEmail || 'none'}`)
          .order('created_at', { ascending: false });

        if (dbOrders && dbOrders.length > 0) {
          const map = new Map<string, Order>();
          userOrders.forEach(o => map.set(o.id, o));
          for (const dbo of dbOrders) {
            if (!map.has(dbo.id)) {
              map.set(dbo.id, { ...dbo, items: dbo.items || [], status_history: [] });
            }
          }
          userOrders = Array.from(map.values());
        }
      } catch (err) {
        console.error('Error fetching Supabase orders:', err);
      }
    }

    userOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setOrders(userOrders);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();
  }, [user]);

  if (!user) return null;

  const tabs: { label: string; value: OrderStatus | 'all' }[] = [
    { label: 'All Orders', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(o => o.status === activeTab);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300';
      case 'confirmed': return 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300';
      case 'shipped': return 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300';
      case 'out_for_delivery': return 'bg-orange-100 dark:bg-orange-950/60 text-orange-800 dark:text-orange-300';
      case 'delivered': return 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300';
      case 'cancelled': return 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300';
      case 'return_requested': return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300';
      case 'returned': return 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-300';
      case 'refunded': return 'bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300';
      default: return 'bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-300';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-1">My Orders</h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">View and track all your bespoke atelier purchases.</p>
      </div>

      <div className="bg-white dark:bg-[#16171b] rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden">
        {/* Tabs */}
        <div className="flex overflow-x-auto border-b border-stone-100 dark:border-stone-800 hide-scrollbar p-2">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                "px-4 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors",
                activeTab === tab.value
                  ? "bg-[#1a1714] dark:bg-amber-600 text-white shadow-sm"
                  : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-0">
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-32 bg-stone-100 dark:bg-stone-800/50 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-stone-100 dark:bg-stone-800 rounded-full flex items-center justify-center text-stone-400">
                <Search size={22} />
              </div>
              <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">No orders found</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 max-w-xs">
                {activeTab === 'all' 
                  ? "You haven't placed any orders yet." 
                  : `You have no ${activeTab.replace(/_/g, ' ')} orders.`}
              </p>
              <Link
                href="/shop"
                className="px-6 py-2.5 bg-[#1a1714] dark:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#c46331] transition-colors"
              >
                Start Shopping →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {filteredOrders.map((order) => (
                <div key={order.id} className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">Order #{order.order_number}</h3>
                        <span className={cn("px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider", getStatusBadge(order.status))}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400">
                        Placed on {formatDate(order.created_at)}
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      {/* Download Tax Invoice Link */}
                      <a
                        href={`/api/invoice/${order.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <FileText size={14} className="text-[#c46331]" />
                        <span>Tax Invoice</span>
                      </a>

                      {/* Track Shipment Link */}
                      <Link 
                        href={`/track-order?orderNumber=${order.order_number}&email=${encodeURIComponent(user.email || '')}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-[#c46331] hover:text-white text-stone-800 dark:text-stone-200 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <Truck size={14} />
                        <span>Track</span>
                      </Link>

                      {/* Return / Exchange Trigger for Delivered Orders */}
                      {(order.status === 'delivered') && (
                        <button
                          onClick={() => setSelectedReturnOrder(order)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 dark:bg-amber-950/40 hover:bg-[#c46331] hover:text-white text-[#c46331] dark:text-amber-300 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs font-semibold transition-colors"
                        >
                          <RotateCcw size={14} />
                          <span>Return / Exchange</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="bg-stone-50 dark:bg-stone-900 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4 border border-stone-200/60 dark:border-stone-800">
                    <div className="flex -space-x-2 overflow-hidden shrink-0">
                      {(order.items || []).slice(0, 3).map((item, idx) => (
                        <div key={idx} className="inline-block h-12 w-12 rounded-xl ring-2 ring-white dark:ring-stone-900 bg-stone-100 dark:bg-stone-800 overflow-hidden">
                          {item.product_image && (
                            <img src={item.product_image} alt={item.product_title} className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                      {(order.items || []).length > 3 && (
                        <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl ring-2 ring-white dark:ring-stone-900 bg-stone-200 dark:bg-stone-800 text-xs font-bold text-stone-600 dark:text-stone-300">
                          +{(order.items || []).length - 3}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 text-xs text-stone-600 dark:text-stone-300">
                      <p>
                        {(order.items || []).length} item(s) • Total: <span className="font-bold text-stone-900 dark:text-stone-100">{formatAmount(order.total_amount)}</span>
                      </p>
                      {(order.items || []).slice(0, 1).map(item => (
                        <p key={item.id} className="text-[11px] text-stone-400 truncate mt-0.5">
                          Includes: {item.product_title} {(order.items || []).length > 1 ? '& more' : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Return Request Modal */}
      {selectedReturnOrder && (
        <RequestReturnModal
          order={selectedReturnOrder}
          isOpen={!!selectedReturnOrder}
          onClose={() => setSelectedReturnOrder(null)}
          onSuccess={() => {
            loadOrders();
          }}
        />
      )}
    </div>
  );
}
