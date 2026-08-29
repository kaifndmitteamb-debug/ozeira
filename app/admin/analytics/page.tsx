'use client';

import { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store/data-store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { Download, TrendingUp, ShoppingBag, CreditCard, Users, BarChart3 } from 'lucide-react';
import type { Order, Product, UserProfile } from '@/types';

export default function AnalyticsAdminPage() {
  const { formatAmount: formatPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);

  useEffect(() => {
    async function loadData() {
      let currentOrders = DataStore.getOrders();
      setProducts(DataStore.getProducts());
      setUsers(DataStore.getUsers());

      if (isSupabaseConfigured) {
        try {
          const { data: dbOrders } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
          if (dbOrders && dbOrders.length > 0) {
            const { data: dbItems } = await supabase.from('order_items').select('*');
            const itemsMap = new Map<string, any[]>();
            (dbItems || []).forEach(item => {
              const list = itemsMap.get(item.order_id) || [];
              list.push(item);
              itemsMap.set(item.order_id, list);
            });

            currentOrders = dbOrders.map(o => ({
              ...o,
              items: itemsMap.get(o.id) || o.items || [],
              status_history: o.status_history || [],
            }));
          }
        } catch (err) {
          console.error('Analytics Supabase sync error:', err);
        }
      }

      setOrders(currentOrders);
    }

    loadData();
  }, []);

  const validOrders = orders.filter(o => o.status !== 'cancelled' && o.status !== 'returned');
  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const totalOrders = orders.length;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const totalCustomers = users.length;
  const totalProducts = products.length;

  const categoryRev: Record<string, number> = {};
  validOrders.forEach(o => {
    (o.items || []).forEach(i => {
      const p = products.find(prod => prod.id === i.product_id);
      if (p) {
        categoryRev[p.category_id] = (categoryRev[p.category_id] || 0) + (i.total_price || 0);
      }
    });
  });
  const topCategories = Object.entries(categoryRev).sort((a,b) => b[1]-a[1]).slice(0, 5);

  const prodSales: Record<string, number> = {};
  validOrders.forEach(o => (o.items || []).forEach(i => prodSales[i.product_id] = (prodSales[i.product_id] || 0) + (i.quantity || 0)));
  const topProducts = Object.entries(prodSales).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id, qty]) => {
    return { product: products.find(p=>p.id===id), qty };
  });

  const razorpay = validOrders.filter(o => o.payment_method === 'razorpay').length;
  const cod = validOrders.filter(o => o.payment_method === 'cod').length;
  const razorpayPercent = totalOrders ? Math.round((razorpay/totalOrders)*100) : 0;
  const codPercent = totalOrders ? Math.round((cod/totalOrders)*100) : 0;

  const statusCounts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {} as Record<string,number>);

  const handleExport = () => {
    const csv = ['Date,Order,Total,Status'].concat(
      orders.map(o => `${o.created_at},${o.order_number},${o.total_amount},${o.status}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ozeira_sales_report.csv';
    a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Atelier Performance & Intelligence</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Real-time GMV, unit velocity, average basket value, and payment mix.</p>
        </div>
        <button onClick={handleExport} className="bg-white dark:bg-[#14151a] border border-neutral-200 dark:border-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 px-4 py-2 rounded-xl flex items-center gap-2 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shadow-sm">
          <Download className="w-3.5 h-3.5" /> Export Revenue CSV
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-[#14151a] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <p className="text-neutral-500 dark:text-neutral-400 text-xs mb-1 flex items-center gap-1.5 font-medium"><TrendingUp className="w-3.5 h-3.5 text-emerald-500"/> Total GMV</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{formatPrice(totalRevenue)}</p>
        </div>
        <div className="bg-white dark:bg-[#14151a] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <p className="text-neutral-500 dark:text-neutral-400 text-xs mb-1 flex items-center gap-1.5 font-medium"><ShoppingBag className="w-3.5 h-3.5 text-blue-500"/> Total Orders</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{totalOrders}</p>
        </div>
        <div className="bg-white dark:bg-[#14151a] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <p className="text-neutral-500 dark:text-neutral-400 text-xs mb-1 flex items-center gap-1.5 font-medium"><BarChart3 className="w-3.5 h-3.5 text-purple-500"/> Basket AOV</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{formatPrice(aov)}</p>
        </div>
        <div className="bg-white dark:bg-[#14151a] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <p className="text-neutral-500 dark:text-neutral-400 text-xs mb-1 flex items-center gap-1.5 font-medium"><Users className="w-3.5 h-3.5 text-brand-amber"/> Total Patrons</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{totalCustomers} <span className="text-emerald-500 text-xs font-normal ml-1">↑ Active</span></p>
        </div>
        <div className="bg-white dark:bg-[#14151a] p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <p className="text-neutral-500 dark:text-neutral-400 text-xs mb-1 flex items-center gap-1.5 font-medium"><CreditCard className="w-3.5 h-3.5 text-neutral-500"/> Catalog Pieces</p>
          <p className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{totalProducts}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#14151a] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4">Top Velocity Pieces</h2>
          <div className="space-y-4">
            {topProducts.map((p, i) => (
              <div key={i} className="flex justify-between items-center text-xs">
                <span className="flex-1 truncate pr-4 font-medium text-neutral-800 dark:text-neutral-200">{p.product?.title || 'Bespoke Atelier Piece'}</span>
                <span className="font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 px-2.5 py-1 rounded-lg">{p.qty} ordered</span>
              </div>
            ))}
            {topProducts.length === 0 && <p className="text-xs text-neutral-400">No orders yet.</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-[#14151a] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4">Revenue Contribution by Category</h2>
          <div className="space-y-4 text-xs">
            {topCategories.map(([catId, rev], i) => {
              const max = Math.max(...topCategories.map(c=>c[1])) || 1;
              const pct = Math.round((rev / max) * 100);
              const catObj = DataStore.getCategories().find(c => c.id === catId || c.slug === catId);
              const catName = catObj?.name || catId.replace(/-/g, ' ');
              return (
                <div key={i}>
                  <div className="flex justify-between mb-1.5">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{catName}</span>
                    <span className="font-bold text-neutral-900 dark:text-neutral-100">{formatPrice(rev)}</span>
                  </div>
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-brand-amber h-2 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              )
            })}
            {topCategories.length === 0 && <p className="text-xs text-neutral-400">No category sales recorded yet.</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-[#14151a] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4">Fulfillment Status Breakdown</h2>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => {
              const pct = totalOrders ? Math.round((count / totalOrders) * 100) : 0;
              return (
                <div key={status} className="flex items-center gap-3 text-xs">
                  <div className="w-28 capitalize font-medium text-neutral-700 dark:text-neutral-300">{status.replace(/_/g, ' ')}</div>
                  <div className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-brand-amber h-2.5 rounded-full" style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="w-12 text-right font-bold text-neutral-900 dark:text-neutral-100">{count}</div>
                </div>
              )
            })}
            {Object.keys(statusCounts).length === 0 && <p className="text-xs text-neutral-400">No orders placed yet.</p>}
          </div>
        </div>

        <div className="bg-white dark:bg-[#14151a] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4">Payment Method Distribution</h2>
          <div className="flex items-center justify-center gap-8 py-6">
            <div className="text-center">
              <div className="text-3xl font-extrabold text-blue-600 dark:text-blue-400 mb-1">{razorpayPercent}%</div>
              <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Razorpay Prepaid</p>
              <p className="text-[11px] text-neutral-400">({razorpay} orders)</p>
            </div>
            <div className="h-16 w-px bg-neutral-200 dark:border-neutral-800"></div>
            <div className="text-center">
              <div className="text-3xl font-extrabold text-brand-amber mb-1">{codPercent}%</div>
              <p className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Cash on Delivery</p>
              <p className="text-[11px] text-neutral-400">({cod} orders)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
