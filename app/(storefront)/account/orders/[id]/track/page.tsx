'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DataStore } from '@/lib/store/data-store';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { Order, OrderStatus } from '@/types';
import { formatDateTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  Home,
  XCircle,
  AlertCircle,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export default function OrderTrackPage() {
  const routeParams = useParams();
  const rawId = routeParams?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string) || '';
  const { formatAmount } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const local = DataStore.getOrderById(id) || DataStore.getOrders().find(o => o.order_number === id);
      if (local) {
        setOrder(local);
        setLoading(false);
        return;
      }

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('orders')
            .select('*, items:order_items(*), status_history:order_status_history(*)')
            .or(`id.eq.${id},order_number.eq.${id}`)
            .maybeSingle();

          if (data && !error) {
            setOrder(data as Order);
          } else {
            setOrder(null);
          }
        } catch (err) {
          console.error('Track fetch error:', err);
          setOrder(null);
        }
      } else {
        setOrder(null);
      }
      setLoading(false);
    }

    fetchOrder();
  }, [id]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-[#14151a] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center shadow-sm">
        <div className="inline-block w-8 h-8 border-2 border-brand-amber border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-neutral-600 dark:text-neutral-400 font-sans text-sm">Querying real-time courier telemetry...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="bg-white dark:bg-[#14151a] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center space-y-4 shadow-sm">
        <AlertCircle size={48} className="mx-auto text-red-500 mb-2" />
        <h2 className="text-xl font-serif font-bold text-neutral-900 dark:text-neutral-100">Order Not Located</h2>
        <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto text-sm">
          The requested identifier could not be matched with an active consignment. Please verify the order number.
        </p>
        <div className="pt-2">
          <Link
            href="/account/orders"
            className="inline-flex items-center px-6 py-2.5 bg-neutral-900 hover:bg-neutral-800 dark:bg-neutral-100 dark:hover:bg-white text-white dark:text-neutral-900 rounded-xl text-sm font-medium transition-all shadow-sm"
          >
            Return to Order Ledger
          </Link>
        </div>
      </div>
    );
  }

  const statusOrder: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
  const isCancelled = order.status === 'cancelled' || order.status === 'returned';
  const currentIndex = isCancelled ? -1 : statusOrder.indexOf(order.status);

  const getStatusIcon = (status: OrderStatus, index: number) => {
    if (isCancelled) {
      if (status === 'pending') return <CheckCircle2 size={22} className="text-neutral-400 dark:text-neutral-600" />;
      return <XCircle size={22} className="text-red-500" />;
    }
    
    if (index < currentIndex) return <CheckCircle2 size={22} className="text-emerald-500" />;
    if (index === currentIndex) {
      switch(status) {
        case 'pending': return <Clock size={22} className="text-amber-500 animate-pulse" />;
        case 'confirmed': return <ShieldCheck size={22} className="text-blue-500" />;
        case 'shipped': return <Package size={22} className="text-purple-500" />;
        case 'out_for_delivery': return <Truck size={22} className="text-brand-amber animate-bounce" />;
        case 'delivered': return <Home size={22} className="text-emerald-500" />;
      }
    }
    return <div className="w-5 h-5 rounded-full border-2 border-neutral-300 dark:border-neutral-700" />;
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch(status) {
      case 'pending': return 'Order Placed';
      case 'confirmed': return 'Verified & Confirmed';
      case 'shipped': return 'Dispatched from Atelier';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered to Patron';
      default: return status;
    }
  };

  const getStatusTimestamp = (status: OrderStatus) => {
    if (!order.status_history) return null;
    const history = order.status_history.find(h => h.status === status);
    return history ? formatDateTime(history.created_at) : null;
  };

  const items = order.items || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <Link
          href="/account/orders"
          className="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-neutral-500 hover:text-brand-amber dark:text-neutral-400 dark:hover:text-brand-amber mb-3 transition-colors"
        >
          <ArrowLeft size={14} className="mr-1.5" /> Back to Orders
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-serif text-neutral-900 dark:text-neutral-100">
              Live Consignment #{order.order_number}
            </h1>
            <p className="text-neutral-500 dark:text-neutral-400 text-xs sm:text-sm mt-1">
              Registered on {formatDateTime(order.created_at)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="px-3.5 py-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 text-xs">
              <span className="text-neutral-400 mr-1.5 uppercase font-mono">Payment:</span>
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 uppercase">{order.payment_method}</span>
            </div>
            <div className="px-3.5 py-1.5 rounded-xl border border-brand-amber/20 bg-brand-amber/10 text-xs">
              <span className="text-neutral-400 dark:text-neutral-500 mr-1.5 uppercase font-mono">Status:</span>
              <span className="font-semibold text-brand-amber capitalize">{order.payment_status}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timeline Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#14151a] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between pb-6 border-b border-neutral-100 dark:border-neutral-800/80 mb-6">
              <div>
                <h2 className="text-lg font-serif font-semibold text-neutral-900 dark:text-neutral-100">Fulfillment Progression</h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">End-to-end telemetry from our master workshop</p>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-semibold">
                {order.status.replace(/_/g, ' ')}
              </span>
            </div>
            
            {isCancelled ? (
              <div className="flex items-start gap-4 mb-8 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30 p-4 rounded-xl border border-red-200 dark:border-red-900/40">
                <XCircle size={24} className="shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm">Order {order.status.charAt(0).toUpperCase() + order.status.slice(1)}</h3>
                  <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">This shipment has been cancelled or recalled to the archive vault.</p>
                </div>
              </div>
            ) : null}

            <div className="relative pl-2 sm:pl-4">
              {/* Vertical line connecting steps */}
              {!isCancelled && (
                <div className="absolute left-[18px] sm:left-[26px] top-4 bottom-8 w-0.5 bg-neutral-200 dark:bg-neutral-800" />
              )}
              
              <div className="space-y-7 relative">
                {(isCancelled ? (['pending', order.status] as OrderStatus[]) : statusOrder).map((status, index) => {
                  const isCompleted = isCancelled ? index === 0 : index <= currentIndex;
                  const isCurrent = isCancelled ? index === 1 : index === currentIndex;
                  const timestamp = getStatusTimestamp(status);
                  const notes = order.status_history?.find(h => h.status === status)?.notes;

                  return (
                    <div
                      key={status}
                      className={cn(
                        "flex gap-4 relative transition-opacity",
                        !isCompleted && !isCurrent ? "opacity-40" : ""
                      )}
                    >
                      {/* Status Icon container */}
                      <div className="relative z-10 shrink-0 bg-white dark:bg-[#14151a] py-1 flex items-center justify-center">
                        {getStatusIcon(status, index)}
                      </div>
                      
                      {/* Content */}
                      <div className="pt-0.5 pb-2 flex-1">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-1 sm:gap-4">
                          <h3 className={cn(
                            "font-medium text-sm sm:text-base",
                            isCurrent ? "text-brand-amber font-semibold" : "text-neutral-900 dark:text-neutral-100"
                          )}>
                            {getStatusLabel(status)}
                          </h3>
                          {timestamp && (
                            <span className="text-xs font-mono text-neutral-400 dark:text-neutral-500 whitespace-nowrap">
                              {timestamp}
                            </span>
                          )}
                        </div>
                        {notes && (
                          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1">{notes}</p>
                        )}
                        
                        {/* Courier Details */}
                        {isCurrent && (status === 'shipped' || status === 'out_for_delivery') && order.tracking_number && (
                          <div className="mt-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl p-4 text-xs sm:text-sm border border-neutral-200/80 dark:border-neutral-800">
                            <p className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5 flex items-center gap-1.5">
                              <Truck size={14} className="text-brand-amber" /> Courier Manifest
                            </p>
                            <p className="text-neutral-600 dark:text-neutral-400">Partner: <span className="font-medium text-neutral-900 dark:text-neutral-200">{order.tracking_courier || 'Express Atelier Logistics'}</span></p>
                            <p className="text-neutral-600 dark:text-neutral-400 mt-0.5">AWB / Consignment: <span className="font-mono font-medium text-neutral-900 dark:text-neutral-200">{order.tracking_number}</span></p>
                            {order.tracking_url && (
                              <a
                                href={order.tracking_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-brand-amber hover:underline font-semibold mt-2.5 text-xs"
                              >
                                View Carrier Tracking Portal <ExternalLink size={12} />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Summary */}
        <div className="space-y-6">
          {/* Order Items Summary */}
          <div className="bg-white dark:bg-[#14151a] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
            <h2 className="font-serif font-semibold text-neutral-900 dark:text-neutral-100 mb-4 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              Curated Selection ({items.length})
            </h2>
            <div className="space-y-3.5">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 items-center">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-800 shrink-0 border border-neutral-200 dark:border-neutral-700">
                    <img src={item.product_image} alt={item.product_title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-neutral-900 dark:text-neutral-100 truncate">{item.product_title}</p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400">Qty: {item.quantity} {item.variant_details?.size ? `• Size: ${item.variant_details.size}` : ''}</p>
                    <p className="text-xs font-semibold text-brand-amber mt-0.5">{formatAmount(item.unit_price)}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-neutral-100 dark:border-neutral-800 mt-5 pt-4 space-y-2 text-xs">
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Subtotal</span>
                <span>{formatAmount(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                  <span>Privilege Discount</span>
                  <span>-{formatAmount(order.discount_amount)}</span>
                </div>
              )}
              {order.loyalty_discount_amount > 0 && (
                <div className="flex justify-between text-brand-amber">
                  <span>Points Redeemed</span>
                  <span>-{formatAmount(order.loyalty_discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                <span>Insured Express Delivery</span>
                <span>{order.shipping_fee === 0 ? 'Complimentary' : formatAmount(order.shipping_fee)}</span>
              </div>
              <div className="flex justify-between font-bold text-sm text-neutral-900 dark:text-neutral-100 pt-3 border-t border-neutral-100 dark:border-neutral-800 mt-2">
                <span>Total Invoiced</span>
                <span className="text-brand-amber">{formatAmount(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          {order.shipping_address && (
            <div className="bg-white dark:bg-[#14151a] rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 shadow-sm">
              <h2 className="font-serif font-semibold text-neutral-900 dark:text-neutral-100 mb-3 pb-2 border-b border-neutral-100 dark:border-neutral-800 text-sm">
                Consignee Destination
              </h2>
              <div className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
                <p className="font-semibold text-neutral-900 dark:text-neutral-100">{order.shipping_address.full_name}</p>
                <p>{order.shipping_address.street}</p>
                {order.shipping_address.apartment && <p>{order.shipping_address.apartment}</p>}
                <p>{order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}</p>
                <p className="pt-1.5 text-neutral-500">Phone: {order.shipping_address.phone}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
