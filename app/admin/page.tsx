'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { DataStore } from '@/lib/store/data-store';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { formatDate, cn } from '@/lib/utils';
import {
  DollarSign,
  ShoppingCart,
  Users,
  Package,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Clock,
  AlertTriangle,
  Star,
  Eye,
  ChevronRight,
  BarChart3,
  Activity,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface KPICard {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

export default function AdminDashboard() {
  const { formatPriceValue } = useCurrency();
  const [mounted, setMounted] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    setMounted(true);

    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('admin-dashboard-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, async () => {
          await DataStore.syncFromSupabase();
          setRefreshTrigger((prev) => prev + 1);
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const data = useMemo(() => {
    if (!mounted) return null;
    const _ = refreshTrigger;

    const orders = DataStore.getOrders();
    const products = DataStore.getProducts();
    const users = DataStore.getUsers();
    const reviews = DataStore.getReviews();

    const totalRevenue = orders
      .filter((o) => o.payment_status === 'paid' || o.status === 'delivered')
      .reduce((sum, o) => sum + o.total_amount, 0);

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'pending').length;
    const shippedOrders = orders.filter((o) => o.status === 'shipped').length;
    const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
    const cancelledOrders = orders.filter((o) => o.status === 'cancelled').length;
    const totalCustomers = users.filter((u) => u.role === 'customer').length;
    const totalProducts = products.length;
    const lowStockProducts = products.filter((p) => p.total_stock > 0 && p.total_stock <= 5);
    const outOfStockProducts = products.filter((p) => p.total_stock === 0);
    const pendingReviews = reviews.filter((r) => r.status === 'pending');
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const recentOrders = [...orders]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    // Compute dynamic real 7-day metrics
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const revenueChart = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toISOString().split('T')[0];
      const dayOrders = orders.filter((o) => o.created_at?.startsWith(dayStr));
      const dayRevenue = dayOrders
        .filter((o) => o.payment_status === 'paid' || o.status === 'delivered')
        .reduce((sum, o) => sum + o.total_amount, 0);

      return {
        day: days[d.getDay()],
        date: dayStr,
        revenue: dayRevenue,
        orderCount: dayOrders.length,
      };
    });

    const maxChartValue = Math.max(...revenueChart.map((r) => r.revenue), 1000);

    return {
      totalRevenue,
      totalOrders,
      pendingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalCustomers,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      pendingReviews,
      avgOrderValue,
      recentOrders,
      revenueChart,
      maxChartValue,
      orders,
      products,
    };
  }, [mounted, refreshTrigger]);

  if (!mounted || !data) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-[#14151a] rounded-xl h-32 border border-neutral-200 dark:border-neutral-800" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-[#14151a] rounded-xl h-80 border border-neutral-200 dark:border-neutral-800" />
          <div className="bg-white dark:bg-[#14151a] rounded-xl h-80 border border-neutral-200 dark:border-neutral-800" />
        </div>
      </div>
    );
  }

  const kpis: KPICard[] = [
    {
      title: 'Total Revenue',
      value: formatPriceValue(data.totalRevenue),
      change: data.totalRevenue > 0 ? 'Live Invoiced' : '₹0.00 Initial',
      changeType: 'positive',
      icon: DollarSign,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    {
      title: 'Total Orders',
      value: data.totalOrders.toString(),
      change: data.totalOrders > 0 ? `${data.totalOrders} Active` : '0 Recorded',
      changeType: 'positive',
      icon: ShoppingCart,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-950/40',
    },
    {
      title: 'Registered Patrons',
      value: data.totalCustomers.toString(),
      change: data.totalCustomers > 0 ? `${data.totalCustomers} Accounts` : '0 Customers',
      changeType: 'positive',
      icon: Users,
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-50 dark:bg-violet-950/40',
    },
    {
      title: 'Avg. Order Value',
      value: formatPriceValue(data.avgOrderValue),
      change: data.avgOrderValue > 0 ? 'Computed AOV' : 'N/A',
      changeType: 'neutral',
      icon: TrendingUp,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-950/40',
    },
  ];

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    pending: {
      label: 'Pending',
      color: 'text-yellow-700 dark:text-yellow-300',
      bg: 'bg-yellow-50 dark:bg-yellow-950/40 border-yellow-200 dark:border-yellow-900/60',
    },
    confirmed: {
      label: 'Confirmed',
      color: 'text-blue-700 dark:text-blue-300',
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60',
    },
    shipped: {
      label: 'Shipped',
      color: 'text-indigo-700 dark:text-indigo-300',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/60',
    },
    out_for_delivery: {
      label: 'Out for Delivery',
      color: 'text-purple-700 dark:text-purple-300',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-900/60',
    },
    delivered: {
      label: 'Delivered',
      color: 'text-green-700 dark:text-green-300',
      bg: 'bg-green-50 dark:bg-green-950/40 border-green-200 dark:border-green-900/60',
    },
    cancelled: {
      label: 'Cancelled',
      color: 'text-red-700 dark:text-red-300',
      bg: 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900/60',
    },
    returned: {
      label: 'Returned',
      color: 'text-neutral-700 dark:text-neutral-300',
      bg: 'bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800',
    },
  };

  const orderStatusBreakdown = [
    { status: 'Pending', count: data.pendingOrders, color: 'bg-yellow-400' },
    { status: 'Shipped', count: data.shippedOrders, color: 'bg-indigo-400' },
    { status: 'Delivered', count: data.deliveredOrders, color: 'bg-green-400' },
    { status: 'Cancelled', count: data.cancelledOrders, color: 'bg-red-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">Live Atelier Dashboard</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Real-time metrics, catalog health, and live customer order fulfillment.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="bg-white dark:bg-[#14151a] rounded-xl border border-neutral-200 dark:border-neutral-800 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', kpi.iconBg)}>
                  <Icon className={cn('w-5 h-5', kpi.iconColor)} />
                </div>
                <span
                  className={cn(
                    'text-xs font-medium flex items-center gap-1 px-2 py-0.5 rounded-full',
                    kpi.changeType === 'positive'
                      ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50'
                      : 'text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800'
                  )}
                >
                  ● {kpi.change}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{kpi.value}</p>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-0.5">{kpi.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts + Alerts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue chart */}
        <div className="lg:col-span-2 bg-white dark:bg-[#14151a] rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Revenue Overview</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Last 7 days real transaction volume
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 rounded-full">
              <Activity className="w-3.5 h-3.5" />
              <span>Realtime Live</span>
            </div>
          </div>
          <div className="flex items-end gap-3 h-48">
            {data.revenueChart.map((bar) => {
              const heightPct =
                data.totalRevenue > 0
                  ? Math.max((bar.revenue / data.maxChartValue) * 100, bar.revenue > 0 ? 15 : 4)
                  : 4;
              return (
                <div key={bar.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full flex justify-center h-36 items-end">
                    <div
                      className="w-full max-w-[36px] bg-brand-amber/20 hover:bg-brand-amber/40 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-t-md transition-all cursor-pointer relative group"
                      style={{ height: `${heightPct}%` }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-[#c46331] rounded-t-md transition-all"
                        style={{ height: bar.revenue > 0 ? '100%' : '0%' }}
                      />
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-neutral-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 shadow-md">
                        {formatPriceValue(bar.revenue)} ({bar.orderCount} orders)
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">{bar.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="bg-white dark:bg-[#14151a] rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
          <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">Order Pipeline</h3>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-4">Distribution by status</p>
          <div className="space-y-3">
            {orderStatusBreakdown.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={cn('w-3 h-3 rounded-full', item.color)} />
                  <span className="text-sm text-neutral-700 dark:text-neutral-300">{item.status}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full', item.color)}
                      style={{ width: `${data.totalOrders > 0 ? (item.count / data.totalOrders) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 w-6 text-right">
                    {item.count}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex items-center justify-between text-sm">
              <span className="text-neutral-500 dark:text-neutral-400">Total Live Orders</span>
              <span className="font-bold text-neutral-900 dark:text-neutral-100">{data.totalOrders}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders + Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white dark:bg-[#14151a] rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="flex items-center justify-between p-5 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">Recent Orders</h3>
            <Link
              href="/admin/orders"
              className="text-xs text-[#c46331] hover:underline font-medium flex items-center gap-1"
            >
              View All
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {data.recentOrders.length === 0 ? (
              <div className="p-8 text-center text-neutral-400">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-medium">No customer orders recorded yet</p>
                <p className="text-xs text-neutral-500 mt-1">Live orders placed by patrons will automatically display here in real-time.</p>
              </div>
            ) : (
              data.recentOrders.map((order) => {
                const statusConf = statusConfig[order.status] || statusConfig.pending;
                return (
                  <div
                    key={order.id}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-neutral-50 dark:hover:bg-[#1c1a17] transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0">
                        <ShoppingCart className="w-4 h-4 text-neutral-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                          {order.order_number}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">
                          {order.user_name || order.guest_email || 'Guest'} · {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className={cn(
                          'text-[11px] font-medium px-2 py-1 rounded-full border',
                          statusConf.bg,
                          statusConf.color
                        )}
                      >
                        {statusConf.label}
                      </span>
                      <span className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 w-24 text-right">
                        {formatPriceValue(order.total_amount)}
                      </span>
                      <Link
                        href={`/admin/orders`}
                        className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Alerts panel */}
        <div className="space-y-4">
          {/* Low stock alert */}
          {data.lowStockProducts.length > 0 && (
            <div className="bg-white dark:bg-[#14151a] rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">Low Stock Alert</h3>
              </div>
              <div className="space-y-2">
                {data.lowStockProducts.slice(0, 5).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-700 dark:text-neutral-300 truncate max-w-[160px]">{p.title}</span>
                    <span className="text-amber-600 dark:text-amber-400 font-medium">{p.total_stock} left</span>
                  </div>
                ))}
              </div>
              {data.lowStockProducts.length > 5 && (
                <Link href="/admin/products" className="text-xs text-[#c46331] hover:underline mt-2 block">
                  +{data.lowStockProducts.length - 5} more items
                </Link>
              )}
            </div>
          )}

          {/* Out of stock */}
          {data.outOfStockProducts.length > 0 && (
            <div className="bg-white dark:bg-[#14151a] rounded-xl border border-red-200 dark:border-red-900/60 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-red-500" />
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">Out of Stock</h3>
              </div>
              <div className="space-y-2">
                {data.outOfStockProducts.slice(0, 3).map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-neutral-700 dark:text-neutral-300 truncate max-w-[160px]">{p.title}</span>
                    <span className="text-red-500 font-medium text-xs">Out of Stock</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pending reviews */}
          {data.pendingReviews.length > 0 && (
            <div className="bg-white dark:bg-[#14151a] rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-violet-500" />
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">Pending Reviews</h3>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                <span className="font-semibold text-violet-600 dark:text-violet-400">{data.pendingReviews.length}</span> reviews waiting for moderation
              </p>
              <Link href="/admin/reviews" className="text-xs text-[#c46331] hover:underline mt-2 block">
                Review now →
              </Link>
            </div>
          )}

          {/* Quick actions */}
          <div className="bg-white dark:bg-[#14151a] rounded-xl border border-neutral-200 dark:border-neutral-800 p-5">
            <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Add New Product', href: '/admin/products', icon: Package },
                { label: 'View All Orders', href: '/admin/orders', icon: ShoppingCart },
                { label: 'Manage Banners', href: '/admin/banners', icon: BarChart3 },
                { label: 'Store Settings', href: '/admin/settings', icon: Clock },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.href}
                    href={action.href}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#1c1a17] hover:text-neutral-900 dark:hover:text-neutral-100 rounded-lg transition-colors"
                  >
                    <Icon className="w-4 h-4 text-neutral-400" />
                    {action.label}
                    <ArrowUpRight className="w-3 h-3 ml-auto text-neutral-300" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
