'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store/data-store';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { useStore } from '@/lib/context/StoreContext';
import { useAuth } from '@/lib/context/AuthContext';
import { cn, formatDate, formatDateTime } from '@/lib/utils';
import { Order, OrderStatus } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { NotificationService } from '@/lib/services/notification-service';
import { SupplierService } from '@/lib/services/supplier-service';
import {
  Search,
  ChevronDown,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  RotateCcw,
  XCircle,
  AlertCircle,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  FileText,
  Send,
  Radio,
  Download,
  Eye,
  Globe2,
  Zap,
} from 'lucide-react';

const ORDER_LIFECYCLE_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'pending', label: 'Placed' },
  { status: 'confirmed', label: 'Confirmed' },
  { status: 'processing', label: 'Processing' },
  { status: 'shipped', label: 'Shipped' },
  { status: 'out_for_delivery', label: 'Out for Delivery' },
  { status: 'delivered', label: 'Delivered' },
];

export default function OrdersManagementPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);
  const [page, setPage] = useState(1);
  const itemsPerPage = 15;

  const { formatAmount } = useCurrency();
  const { refreshData } = useStore();
  const { user, isAdmin, isOrderManager } = useAuth();

  const loadOrders = () => {
    const allOrders = DataStore.getOrders();
    allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setOrders(allOrders);
    setLoading(false);
  };

  useEffect(() => {
    loadOrders();

    // Setup Supabase Realtime Subscription for instant order updates
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('admin-orders-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          async (payload) => {
            console.log('⚡ [Realtime] New order placed:', payload);
            await DataStore.syncFromSupabase();
            loadOrders();
            if (payload.new) {
              setNewOrderAlert(payload.new as Order);
              setTimeout(() => setNewOrderAlert(null), 8000);
            }
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          async () => {
            console.log('⚡ [Realtime] Order status updated in Supabase');
            await DataStore.syncFromSupabase();
            loadOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  const handleUpdateStatus = async (
    orderId: string,
    newStatus: OrderStatus,
    customerNotes?: string,
    adminNotes?: string,
    courier?: string,
    trackingNumber?: string,
    trackingUrl?: string
  ) => {
    const res = await DataStore.updateOrderStatus(
      orderId,
      newStatus,
      customerNotes,
      courier,
      trackingNumber,
      trackingUrl
    );

    if (adminNotes) {
      const ordersList = DataStore.getOrders();
      const target = ordersList.find((o) => o.id === orderId);
      if (target) {
        target.admin_notes = adminNotes;
        if (isSupabaseConfigured) {
          supabase.from('orders').update({ admin_notes: adminNotes }).eq('id', orderId);
        }
      }
    }

    refreshData();
    loadOrders();
    return res;
  };

  const filteredOrders = orders.filter((order) => {
    const matchesFilter = filter === 'all' || order.status === filter;
    const matchesSearch =
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.user_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.guest_email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.shipping_address?.phone || '').includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  const handleExportOrdersCSV = () => {
    const headers = ['Order Number', 'Date', 'Customer', 'Email', 'Phone', 'Items Qty', 'Total Amount', 'Payment Method', 'Payment Status', 'Status', 'Courier', 'Tracking No'];
    const rows = filteredOrders.map((o) => [
      o.order_number,
      formatDate(o.created_at),
      o.user_name || o.guest_email || 'Guest',
      o.guest_email || '',
      o.shipping_address?.phone || o.guest_phone || '',
      o.items?.reduce((sum, i) => sum + i.quantity, 0) || 0,
      o.total_amount,
      o.payment_method?.toUpperCase(),
      o.payment_status?.toUpperCase(),
      o.status?.toUpperCase(),
      o.tracking_courier || '',
      o.tracking_number || '',
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ozeira-orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = filteredOrders.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50';
      case 'confirmed':
        return 'bg-sky-100 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-900/50';
      case 'processing':
        return 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/50';
      case 'shipped':
        return 'bg-blue-100 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-900/50';
      case 'out_for_delivery':
        return 'bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-900/50';
      case 'delivered':
        return 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50';
      case 'cancelled':
        return 'bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/50';
      case 'return_requested':
      case 'returned':
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 border-neutral-300 dark:border-neutral-700';
      case 'refunded':
        return 'bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/50';
      default:
        return 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700';
    }
  };

  const tabs: { label: string; value: OrderStatus | 'all' }[] = [
    { label: 'All Orders', value: 'all' },
    { label: 'Placed', value: 'pending' },
    { label: 'Confirmed', value: 'confirmed' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Out for Delivery', value: 'out_for_delivery' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
    { label: 'Refunded', value: 'refunded' },
  ];

  return (
    <div className="space-y-6">
      {/* Realtime New Order Floating Banner */}
      {newOrderAlert && (
        <div className="p-4 bg-gradient-to-r from-neutral-900 via-amber-950 to-neutral-900 text-white rounded-2xl shadow-xl border border-brand-amber/30 flex items-center justify-between animate-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-amber/20 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-brand-amber">
                ✨ New Order Received: #{newOrderAlert.order_number}
              </h4>
              <p className="text-xs text-neutral-300 mt-0.5">
                {newOrderAlert.user_name || newOrderAlert.guest_email} just placed an order for{' '}
                <strong className="text-white">₹{newOrderAlert.total_amount?.toLocaleString()}</strong> via{' '}
                {newOrderAlert.payment_method?.toUpperCase()}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setExpandedOrderId(newOrderAlert.id);
              setNewOrderAlert(null);
            }}
            className="px-4 py-1.5 bg-brand-amber hover:bg-brand-amber-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm"
          >
            View Order →
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Orders & Fulfillment
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Real-time fulfillment, live carrier dispatching, customer notifications & refunds
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportOrdersCSV}
            className="px-3.5 py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 bg-white dark:bg-[#14151a] border border-neutral-200 dark:border-neutral-800 rounded-xl hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Orders CSV</span>
          </button>
          {/* Realtime Live Indicator */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-full text-xs font-medium text-emerald-800 dark:text-emerald-300">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Realtime Live Sync
          </div>
        </div>
      </div>

      {/* Main Filter & Table Card */}
      <div className="bg-white dark:bg-[#14151a] rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row gap-4 items-center justify-between bg-neutral-50/50 dark:bg-neutral-900/50">
          {/* Status Tabs */}
          <div className="flex overflow-x-auto space-x-1.5 w-full md:w-auto pb-2 md:pb-0 hide-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setFilter(tab.value);
                  setPage(1);
                }}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all uppercase tracking-wider',
                  filter === tab.value
                    ? 'bg-neutral-900 dark:bg-brand-amber text-white shadow-xs'
                    : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search #, customer, email, phone..."
              className="w-full pl-9 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 outline-none focus:border-brand-amber transition-colors"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-neutral-400">
            <Package className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
            <p className="text-sm font-medium text-neutral-600 dark:text-neutral-400">No orders found matching your criteria.</p>
            <p className="text-xs text-neutral-400 mt-1">Try selecting another status tab or clear the search query.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5">Order #</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Date & Time</th>
                  <th className="px-6 py-3.5">Items</th>
                  <th className="px-6 py-3.5">Total Amount</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {paginatedOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr
                      className="hover:bg-brand-amber/5 dark:hover:bg-neutral-900/50 cursor-pointer transition-colors"
                      onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                    >
                      <td className="px-6 py-4 font-bold text-neutral-900 dark:text-neutral-100">
                        <span className="text-brand-amber">{order.order_number}</span>
                        <ChevronDown
                          className={cn(
                            'inline-block ml-2 h-3.5 w-3.5 text-neutral-400 transition-transform',
                            expandedOrderId === order.id ? 'rotate-180 text-brand-amber' : ''
                          )}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-neutral-900 dark:text-neutral-100">{order.user_name || order.shipping_address?.full_name}</div>
                        <div className="text-[11px] text-neutral-400">{order.guest_email || order.shipping_address?.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-neutral-500 dark:text-neutral-400">{formatDate(order.created_at)}</td>
                      <td className="px-6 py-4 text-neutral-700 dark:text-neutral-300">
                        {order.items?.length || 0} {(order.items?.length || 0) === 1 ? 'piece' : 'pieces'}
                      </td>
                      <td className="px-6 py-4 font-bold text-neutral-900 dark:text-neutral-100">{formatAmount(order.total_amount)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'px-2 py-0.5 inline-flex text-[10px] font-bold uppercase rounded-md tracking-wider border',
                            order.payment_status === 'paid'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
                              : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50'
                          )}
                        >
                          {order.payment_method?.toUpperCase()} • {order.payment_status?.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border inline-flex items-center gap-1.5',
                            getStatusBadge(order.status)
                          )}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                    </tr>
                    {expandedOrderId === order.id && (
                      <tr>
                        <td colSpan={7} className="px-6 py-4 bg-neutral-50/60 dark:bg-neutral-900/60 border-y border-neutral-200 dark:border-neutral-800">
                          <OrderDetailView
                            order={order}
                            formatAmount={formatAmount}
                            onUpdateStatus={handleUpdateStatus}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3.5 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 bg-neutral-50/50 dark:bg-neutral-900/50">
            <span>
              Showing {(page - 1) * itemsPerPage + 1} to{' '}
              {Math.min(page * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} entries
            </span>
            <div className="flex space-x-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-medium disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 font-medium disabled:opacity-40 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function OrderDetailView({
  order,
  formatAmount,
  onUpdateStatus,
}: {
  order: Order;
  formatAmount: (val: number) => string;
  onUpdateStatus: (
    id: string,
    status: OrderStatus,
    customerNotes?: string,
    adminNotes?: string,
    courier?: string,
    trackingNum?: string,
    trackingUrl?: string
  ) => Promise<any>;
}) {
  const [newStatus, setNewStatus] = useState<OrderStatus>(order.status);
  const [customerNotes, setCustomerNotes] = useState('');
  const [adminNotes, setAdminNotes] = useState(order.admin_notes || '');
  const [courier, setCourier] = useState(order.tracking_courier || 'Blue Dart Express');
  const [trackingNum, setTrackingNum] = useState(order.tracking_number || '');
  const [trackingUrl, setTrackingUrl] = useState(order.tracking_url || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [isPushingSupplier, setIsPushingSupplier] = useState(false);

  const recipientTarget = order.guest_email || order.shipping_address?.phone || 'Customer';

  const handleAutoFulfillSupplier = async () => {
    setIsPushingSupplier(true);
    try {
      const res = await SupplierService.handleOrderPlaced(order);
      if (res.fulfillmentsCreated.length > 0) {
        const firstFul = res.fulfillmentsCreated[0];
        setSaveSuccessMsg(`🚀 Auto-fulfilled via ${firstFul.supplierName}! AWB: ${firstFul.trackingNumber || 'Processing'}`);
        if (firstFul.trackingNumber) {
          setTrackingNum(firstFul.trackingNumber);
          setCourier(firstFul.trackingCourier || 'Express Air');
          setNewStatus('shipped');
        }
      } else {
        setSaveSuccessMsg('⚠️ No items in this order are mapped to active suppliers. Map them in Suppliers & Dropship.');
      }
    } catch (err: any) {
      setSaveSuccessMsg(`❌ Supplier push failed: ${err?.message || 'Error'}`);
    } finally {
      setIsPushingSupplier(false);
      setTimeout(() => setSaveSuccessMsg(''), 7000);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await onUpdateStatus(
      order.id,
      newStatus,
      customerNotes || undefined,
      adminNotes || undefined,
      courier,
      trackingNum,
      trackingUrl
    );
    const notif = res?.notification;
    if (notif?.emailSent) {
      setSaveSuccessMsg(`✅ Live email delivered to ${notif.recipient || recipientTarget}! Order updated to ${newStatus.toUpperCase()}`);
    } else if (notif?.simulated) {
      setSaveSuccessMsg(`⚠️ Status updated to ${newStatus.toUpperCase()} & saved to database, but live email was not sent because SMTP credentials are not configured in Store Settings.`);
    } else if (notif?.error) {
      setSaveSuccessMsg(`⚠️ Status updated to ${newStatus.toUpperCase()}, but email sending encountered an issue: ${notif.error}`);
    } else {
      setSaveSuccessMsg(`✨ Notification dispatched to ${recipientTarget}! Status updated to ${newStatus.toUpperCase()}`);
    }
    setIsSaving(false);
    setCustomerNotes('');
    setTimeout(() => setSaveSuccessMsg(''), 7000);
  };

  const handleQuickStatus = async (targetStatus: OrderStatus) => {
    setNewStatus(targetStatus);
    const res = await onUpdateStatus(
      order.id,
      targetStatus,
      `Order transitioned to ${targetStatus.replace(/_/g, ' ').toUpperCase()}`,
      adminNotes || undefined,
      courier,
      trackingNum,
      trackingUrl
    );
    const notif = res?.notification;
    if (notif?.emailSent) {
      setSaveSuccessMsg(`✅ Live email delivered to ${notif.recipient || recipientTarget}! Status updated to ${targetStatus.toUpperCase()}`);
    } else if (notif?.simulated) {
      setSaveSuccessMsg(`⚠️ Status updated to ${targetStatus.toUpperCase()} & saved to database, but live email was not sent because SMTP credentials are not configured in Store Settings.`);
    } else if (notif?.error) {
      setSaveSuccessMsg(`⚠️ Status updated to ${targetStatus.toUpperCase()}, but email sending failed: ${notif.error}`);
    } else {
      setSaveSuccessMsg(`✨ Notification dispatched to ${recipientTarget}! Status updated to ${targetStatus.toUpperCase()}`);
    }
    setTimeout(() => setSaveSuccessMsg(''), 7000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 bg-white dark:bg-[#14151a] rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm text-neutral-900 dark:text-neutral-100">
      {/* Left 2 Cols: Order Items, Shipping Address & Cost Breakdown */}
      <div className="lg:col-span-2 space-y-6">
        {/* Lifecycle Stepper Navigation */}
        <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3 flex items-center justify-between">
            <span>Fulfillment Pipeline Progression</span>
            <span className="text-brand-amber">Current: {order.status.replace(/_/g, ' ').toUpperCase()}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {ORDER_LIFECYCLE_STEPS.map((step) => {
              const isCurrent = order.status === step.status;
              return (
                <button
                  key={step.status}
                  onClick={() => handleQuickStatus(step.status)}
                  className={cn(
                    'py-2 px-2 rounded-lg text-xs font-bold uppercase tracking-wider text-center border transition-all',
                    isCurrent
                      ? 'bg-brand-amber text-white border-brand-amber shadow-xs'
                      : 'bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700 hover:border-brand-amber hover:text-brand-amber'
                  )}
                >
                  {step.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ordered Items Table */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-3">
            Itemized Order Breakdown ({order.items?.length || 0})
          </h3>
          <div className="space-y-3">
            {(order.items || []).map((item) => (
              <div key={item.id} className="flex items-center space-x-4 bg-neutral-50/50 dark:bg-neutral-900/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                <img
                  src={item.product_image || 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=300'}
                  alt={item.product_title}
                  className="w-14 h-14 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">{item.product_title}</p>
                  <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {item.variant_details?.size && `Size: ${item.variant_details.size}`}
                    {item.variant_details?.color && ` • Color: ${item.variant_details.color}`}
                    {item.variant_details?.sku && ` • SKU: ${item.variant_details.sku}`}
                  </p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1">
                    Qty: <strong>{item.quantity}</strong> × {formatAmount(item.unit_price)}
                  </p>
                </div>
                <div className="text-xs font-bold text-neutral-900 dark:text-neutral-100">{formatAmount(item.total_price)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Address & Cost Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Shipping Details */}
          <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 mb-3 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-brand-amber" /> Delivery Address
            </h4>
            <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1 leading-relaxed">
              <p className="font-bold text-neutral-900 dark:text-neutral-100">{order.shipping_address?.full_name || order.user_name}</p>
              <p>{order.shipping_address?.street} {order.shipping_address?.apartment ? `, ${order.shipping_address?.apartment}` : ''}</p>
              <p>{order.shipping_address?.city}, {order.shipping_address?.state} {order.shipping_address?.postal_code}</p>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">{order.shipping_address?.country || 'India'}</p>
              <div className="pt-2 border-t border-neutral-200/80 dark:border-neutral-800 mt-2 space-y-1">
                <p className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
                  <Phone className="w-3 h-3 text-neutral-400" /> {order.shipping_address?.phone || order.guest_phone || 'N/A'}
                </p>
                {order.guest_email && (
                  <p className="flex items-center gap-1 text-neutral-700 dark:text-neutral-300">
                    <Mail className="w-3 h-3 text-neutral-400" /> {order.guest_email}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 mb-3">Financial Settlement</h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Subtotal</span>
                <span>{formatAmount(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Discount ({order.coupon_code || 'Promo'})</span>
                  <span>-{formatAmount(order.discount_amount)}</span>
                </div>
              )}
              {order.loyalty_discount_amount > 0 && (
                <div className="flex justify-between text-brand-amber font-medium">
                  <span>Loyalty Points Discount</span>
                  <span>-{formatAmount(order.loyalty_discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Shipping Fee</span>
                <span>{order.shipping_fee > 0 ? formatAmount(order.shipping_fee) : 'Complimentary'}</span>
              </div>
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Tax (GST 12%)</span>
                <span>{formatAmount(order.tax_amount)}</span>
              </div>
              <div className="flex justify-between font-bold text-neutral-900 dark:text-neutral-100 pt-2 border-t border-neutral-200 dark:border-neutral-800 text-sm">
                <span>Total Amount</span>
                <span className="text-brand-amber">{formatAmount(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Manage Status, Carrier Tracking & Staff Notes */}
      <div className="space-y-6">
        <div className="bg-neutral-50 dark:bg-neutral-900 p-5 rounded-xl border border-neutral-200 dark:border-neutral-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-brand-amber" /> State Transition & Dispatch
          </h3>

          <div className="space-y-4">
            {/* Status Select */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                Fulfillment Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl focus:border-brand-amber text-xs font-medium bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 p-2.5 outline-none"
              >
                <option value="pending">Placed (Pending)</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing in Atelier</option>
                <option value="shipped">Shipped (In Transit)</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered to Patron</option>
                <option value="cancelled">Cancelled</option>
                <option value="return_requested">Return Requested</option>
                <option value="returned">Returned</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            {/* Courier Dispatch Fields */}
            {(newStatus === 'shipped' || newStatus === 'out_for_delivery' || order.tracking_number) && (
              <div className="space-y-3 p-3.5 bg-white dark:bg-neutral-950/40 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Logistics & AWB</span>
                  <button
                    type="button"
                    onClick={() => {
                      const num = `BD-OZ${order.order_number.replace(/[^0-9]/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`;
                      setTrackingNum(num);
                      setCourier('Blue Dart Express');
                      setTrackingUrl(`http://localhost:3000/track-order?orderNumber=${order.order_number}&email=${encodeURIComponent(order.guest_email || '')}`);
                    }}
                    className="text-[10px] font-bold uppercase text-brand-amber hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="w-3 h-3" /> Auto-Generate AWB
                  </button>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                    Courier Partner
                  </label>
                  <input
                    type="text"
                    value={courier}
                    onChange={(e) => setCourier(e.target.value)}
                    className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs p-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 outline-none focus:border-brand-amber"
                    placeholder="e.g. Blue Dart, Delhivery, DHL"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                    AWB / Tracking Number
                  </label>
                  <input
                    type="text"
                    value={trackingNum}
                    onChange={(e) => setTrackingNum(e.target.value)}
                    className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs p-2 font-mono bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 outline-none focus:border-brand-amber"
                    placeholder="e.g. BLUEDART-99281726"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                    Tracking URL
                  </label>
                  <input
                    type="url"
                    value={trackingUrl}
                    onChange={(e) => setTrackingUrl(e.target.value)}
                    className="w-full border border-neutral-300 dark:border-neutral-700 rounded-lg text-xs p-2 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 outline-none focus:border-brand-amber"
                    placeholder="https://track.bluedart.com/..."
                  />
                </div>
              </div>
            )}

            {/* Customer Notification Note */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1">
                Customer Email Note <span className="text-neutral-400 font-normal">(Sent via Email/SMS)</span>
              </label>
              <textarea
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs p-2.5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:border-brand-amber"
                rows={2}
                placeholder="e.g. Dispatched with tamper-proof security seal."
              />
            </div>

            {/* Internal Staff Notes (Visible only to Admin) */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 mb-1 flex items-center justify-between">
                <span>Internal Staff Note</span>
                <span className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 rounded font-bold">Admin Only</span>
              </label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full border border-neutral-300 dark:border-neutral-700 rounded-xl text-xs p-2.5 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 outline-none focus:border-brand-amber"
                rows={2}
                placeholder="Internal verification notes..."
              />
            </div>

            {saveSuccessMsg && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-xl border border-emerald-200 dark:border-emerald-900/50 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{saveSuccessMsg}</span>
              </div>
            )}

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-brand-amber hover:bg-brand-amber-dark transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 animate-spin" /> Dispatching Notification...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" /> Commit Order Update & Notify
                </>
              )}
            </button>

            {/* Auto-Fulfill via Supplier Integration Action */}
            <button
              type="button"
              onClick={handleAutoFulfillSupplier}
              disabled={isPushingSupplier}
              className="w-full py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-300 dark:border-amber-800/60 transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-brand-amber" />
              {isPushingSupplier ? 'Routing to Supplier API...' : 'Auto-Route to CJ / DeoDap'}
            </button>

            {/* Preview Email Template Action */}
            <button
              type="button"
              onClick={() => setShowEmailPreview(!showEmailPreview)}
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-brand-amber" />
              {showEmailPreview ? 'Hide Customer Email Preview' : 'Preview Customer Email Template'}
            </button>

            {/* Download Tax Invoice Link */}
            <a
              href={`/api/invoice/${order.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-[#1c1d22] hover:bg-neutral-50 dark:hover:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 transition-all flex items-center justify-center gap-1.5 shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-brand-amber" />
              Download GST Tax Invoice (PDF)
            </a>

            {/* Email Preview Drawer */}
            {showEmailPreview && (
              <div className="p-3.5 bg-white dark:bg-neutral-900 rounded-xl border border-neutral-300 dark:border-neutral-700 text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
                  <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-brand-amber" /> Outbound Email Preview
                  </span>
                  <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">To: {order.guest_email || 'patron@example.com'}</span>
                </div>
                <div className="max-h-60 overflow-y-auto rounded border border-neutral-200 dark:border-neutral-800 bg-[#fdfbf9] dark:bg-black/30 p-2 text-[11px] text-neutral-900 dark:text-neutral-100">
                  <div
                    dangerouslySetInnerHTML={{
                      __html: NotificationService.generateOrderEmail(
                        { ...order, status: newStatus, tracking_courier: courier, tracking_number: trackingNum, tracking_url: trackingUrl },
                        `order_${newStatus}`,
                        customerNotes
                      ).html,
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status Audit History */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 border-b border-neutral-200 dark:border-neutral-800 pb-2 mb-3">
            Audit Timeline & Status Log
          </h4>
          <div className="space-y-3 max-h-56 overflow-y-auto pr-2 text-xs">
            {(order.status_history || []).slice().reverse().map((history) => (
              <div key={history.id} className="relative pl-4 border-l-2 border-brand-amber/40 pb-2">
                <div className="absolute w-2 h-2 bg-brand-amber rounded-full -left-[5px] top-1.5" />
                <p className="font-bold text-neutral-900 dark:text-neutral-100 uppercase text-[11px] tracking-wider">
                  {history.status.replace(/_/g, ' ')}
                </p>
                <p className="text-[10px] text-neutral-400">{formatDateTime(history.created_at)}</p>
                {history.notes && <p className="text-neutral-600 dark:text-neutral-400 mt-1 bg-neutral-50 dark:bg-neutral-800/60 p-2 rounded-lg border border-neutral-100 dark:border-neutral-800">{history.notes}</p>}
                <p className="text-[10px] text-neutral-400 mt-0.5 font-medium">Updated by {history.updated_by}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
