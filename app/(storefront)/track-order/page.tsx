'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { DataStore } from '@/lib/store/data-store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { Order, OrderStatus } from '@/types';
import { formatDateTime, formatDate } from '@/lib/utils';
import {
  Search,
  Truck,
  CheckCircle2,
  Clock,
  Package,
  Home,
  XCircle,
  AlertCircle,
  ExternalLink,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Image from 'next/image';

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const { formatAmount } = useCurrency();

  const [orderNumberInput, setOrderNumberInput] = useState(searchParams.get('orderNumber') || searchParams.get('id') || '');
  const [contactInput, setContactInput] = useState(searchParams.get('email') || searchParams.get('phone') || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // Auto-search if parameters are provided in URL
  useEffect(() => {
    const qOrder = searchParams.get('orderNumber') || searchParams.get('id');
    const qContact = searchParams.get('email') || searchParams.get('phone');
    if (qOrder && qContact) {
      handleLookup(qOrder, qContact);
    }
  }, [searchParams]);

  const handleLookup = async (ordNum: string, contact: string) => {
    // Check rate limit lockout
    if (lockoutUntil && Date.now() < lockoutUntil) {
      const remainingSecs = Math.ceil((lockoutUntil - Date.now()) / 1000);
      setErrorMsg(`Too many failed lookup attempts. Please wait ${remainingSecs}s before trying again.`);
      return;
    }

    const cleanOrdNum = ordNum.trim().toUpperCase();
    const cleanContact = contact.trim().toLowerCase();

    if (!cleanOrdNum || !cleanContact) {
      setErrorMsg('Please enter both your Order Number and the Email or Phone Number used during checkout.');
      return;
    }

    setErrorMsg('');
    setSearched(true);

    const allOrders = DataStore.getOrders();
    let found = allOrders.find((o) => {
      const matchNumber = o.order_number.toUpperCase() === cleanOrdNum || o.id.toUpperCase() === cleanOrdNum;
      if (!matchNumber) return false;

      const emailMatch = o.guest_email?.toLowerCase() === cleanContact || o.shipping_address?.full_name?.toLowerCase() === cleanContact;
      const phoneMatch = o.guest_phone?.replace(/[^0-9]/g, '') === cleanContact.replace(/[^0-9]/g, '') ||
                         o.shipping_address?.phone?.replace(/[^0-9]/g, '') === cleanContact.replace(/[^0-9]/g, '');

      return emailMatch || phoneMatch;
    });

    // Fallback to Supabase database if not in local store
    if (!found && isSupabaseConfigured) {
      try {
        const { data: dbOrder } = await supabase
          .from('orders')
          .select('*')
          .or(`order_number.ilike.${cleanOrdNum},id.eq.${cleanOrdNum}`)
          .single();

        if (dbOrder) {
          const emailMatch = dbOrder.guest_email?.toLowerCase() === cleanContact || dbOrder.shipping_address?.full_name?.toLowerCase() === cleanContact;
          const phoneMatch = dbOrder.guest_phone?.replace(/[^0-9]/g, '') === cleanContact.replace(/[^0-9]/g, '') ||
                             dbOrder.shipping_address?.phone?.replace(/[^0-9]/g, '') === cleanContact.replace(/[^0-9]/g, '');

          if (emailMatch || phoneMatch) {
            const { data: dbItems } = await supabase.from('order_items').select('*').eq('order_id', dbOrder.id);
            const { data: dbHistory } = await supabase.from('order_status_history').select('*').eq('order_id', dbOrder.id).order('created_at', { ascending: true });

            found = {
              ...dbOrder,
              items: dbItems || [],
              status_history: dbHistory || [],
            };
          }
        }
      } catch (err) {
        console.error('Supabase track order error:', err);
      }
    }

    if (found) {
      setOrder(found);
      setAttempts(0);
    } else {
      setOrder(null);
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setLockoutUntil(Date.now() + 120000); // 2 min cooldown
        setErrorMsg('Too many invalid lookup attempts. Please wait 2 minutes or contact concierge support.');
      } else {
        setErrorMsg(`No matching order found for ${cleanOrdNum} with the provided contact info. Please verify your order number and email/phone.`);
      }
    }
  };

  const statusOrder: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'out_for_delivery', 'delivered'];
  const isCancelled = order?.status === 'cancelled' || order?.status === 'returned';
  const currentIndex = order && !isCancelled ? statusOrder.indexOf(order.status) : -1;

  const getStatusStepIcon = (status: OrderStatus, index: number) => {
    if (isCancelled) {
      if (status === 'pending') return <CheckCircle2 className="w-5 h-5 text-stone-400" />;
      return <XCircle className="w-5 h-5 text-rose-500" />;
    }
    if (index < currentIndex) return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    if (index === currentIndex) {
      switch (status) {
        case 'pending': return <Clock className="w-5 h-5 text-amber-500 animate-pulse" />;
        case 'confirmed': return <CheckCircle2 className="w-5 h-5 text-blue-500 animate-pulse" />;
        case 'shipped': return <Package className="w-5 h-5 text-indigo-500 animate-pulse" />;
        case 'out_for_delivery': return <Truck className="w-5 h-5 text-[#c46331] animate-pulse" />;
        case 'delivered': return <Home className="w-5 h-5 text-emerald-600" />;
      }
    }
    return <div className="w-3 h-3 rounded-full bg-stone-300" />;
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'Order Placed';
      case 'confirmed': return 'Confirmed';
      case 'shipped': return 'Shipped';
      case 'out_for_delivery': return 'Out for Delivery';
      case 'delivered': return 'Delivered';
      default: return status;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="w-12 h-12 rounded-full bg-[#c46331]/10 text-[#c46331] flex items-center justify-center mx-auto mb-3">
          <Truck className="w-6 h-6" />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-stone-900 dark:text-stone-100 mb-2">
          Track Your Atelier Order
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
          Enter your Order Number and Email or Phone Number to view live status, courier milestones, and delivery estimates. No login required.
        </p>
      </div>

      {/* Lookup Form */}
      <div className="max-w-2xl mx-auto bg-white dark:bg-[#16171b] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm mb-12">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLookup(orderNumberInput, contactInput);
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Order Number *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. OZ-2026-2744"
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331] font-mono transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1.5">
                Email or Phone *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. patron@example.com"
                value={contactInput}
                onChange={(e) => setContactInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331] transition-all"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center gap-2 border border-red-200 dark:border-red-900/60">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[#1a1714] hover:bg-[#c46331] text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            <span>Track Shipment Status</span>
          </button>
        </form>
      </div>

      {/* Verified Order Results */}
      {order && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Order Overview Header Card */}
          <div className="bg-white dark:bg-[#16171b] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#c46331] dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-1 rounded-full">
                  Status: {order.status.replace(/_/g, ' ').toUpperCase()}
                </span>
                <h2 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mt-2">
                  Order #{order.order_number}
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Placed on {formatDate(order.created_at)} • {order.items.length} item(s) • Total: {formatAmount(order.total_amount)}
                </p>
              </div>

              {order.tracking_number && (
                <div className="text-left sm:text-right bg-stone-50 dark:bg-stone-900 p-3 rounded-xl border border-stone-200 dark:border-stone-800">
                  <p className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                    Courier: {order.tracking_courier || 'Express Dispatch'}
                  </p>
                  <p className="text-xs font-mono text-stone-500 dark:text-stone-400 mt-0.5">
                    AWB: {order.tracking_number}
                  </p>
                  {order.tracking_url && (
                    <a
                      href={order.tracking_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-[#c46331] dark:text-amber-400 font-semibold mt-1 hover:underline"
                    >
                      Live Courier Tracking <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Stepper Timeline */}
            {!isCancelled ? (
              <div className="pt-8 pb-4">
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -mt-0.5 w-full h-1 bg-stone-100 dark:bg-stone-800 -z-0" />
                  <div className="relative flex justify-between z-10">
                    {statusOrder.map((step, idx) => {
                      const isCompleted = currentIndex >= idx;
                      const isCurrent = currentIndex === idx;
                      return (
                        <div key={step} className="flex flex-col items-center">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-[#16171b] border-2 transition-all ${
                              isCompleted
                                ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shadow-sm'
                                : 'border-stone-200 dark:border-stone-700 text-stone-300 dark:text-stone-600'
                            }`}
                          >
                            {getStatusStepIcon(step, idx)}
                          </div>
                          <span
                            className={`mt-2 text-xs font-medium text-center ${
                              isCurrent
                                ? 'text-[#c46331] dark:text-amber-400 font-bold'
                                : isCompleted
                                ? 'text-stone-800 dark:text-stone-200 font-semibold'
                                : 'text-stone-400 dark:text-stone-500'
                            }`}
                          >
                            {getStatusLabel(step)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 rounded-xl my-4 text-xs font-medium border border-rose-200 dark:border-rose-900/60">
                This order has been {order.status}.
              </div>
            )}
          </div>

          {/* Grid: Items & Shipping details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Items List */}
            <div className="lg:col-span-2 bg-white dark:bg-[#16171b] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
              <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base mb-4">
                Items in this Shipment
              </h3>
              <div className="divide-y divide-stone-100 dark:divide-stone-800">
                {order.items.map((item) => (
                  <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 rounded-xl bg-stone-100 dark:bg-stone-800 overflow-hidden shrink-0 border border-stone-200 dark:border-stone-700">
                        {item.product_image && (
                          <img
                            src={item.product_image}
                            alt={item.product_title}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-stone-900 dark:text-stone-100">{item.product_title}</h4>
                        {item.variant_details && (
                          <p className="text-[11px] text-stone-500 dark:text-stone-400">
                            {item.variant_details.size && `Size: ${item.variant_details.size}`}
                            {item.variant_details.color && ` • Color: ${item.variant_details.color}`}
                          </p>
                        )}
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Qty: {item.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100">{formatAmount(item.total_price)}</p>
                      <p className="text-[10px] text-stone-400 dark:text-stone-500">{formatAmount(item.unit_price)} each</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Col: Address */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-[#16171b] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
                <h3 className="font-serif font-bold text-stone-900 dark:text-stone-100 text-base mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#c46331]" /> Delivery Address
                </h3>
                <div className="text-xs text-stone-600 dark:text-stone-300 space-y-1">
                  <p className="font-semibold text-stone-900 dark:text-stone-100">{order.shipping_address.full_name}</p>
                  <p>{order.shipping_address.street}</p>
                  {order.shipping_address.apartment && <p>{order.shipping_address.apartment}</p>}
                  <p>
                    {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.postal_code}
                  </p>
                  <p>{order.shipping_address.country}</p>
                  <p className="pt-2 font-mono text-stone-500 dark:text-stone-400">Ph: {order.shipping_address.phone}</p>
                </div>
              </div>

              {/* Guest Upsell Prompt */}
              {(!order.user_id || order.guest_email) && (
                <div className="bg-gradient-to-br from-stone-900 to-stone-800 text-white rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Sparkles className="w-4 h-4" /> Save Order to Account
                  </div>
                  <p className="text-xs text-stone-300 mb-4 leading-relaxed">
                    Create a free Ozeira Patron account to save this order to your permanent dashboard and claim <strong>250 Welcome Points</strong>.
                  </p>
                  <Link
                    href={`/auth/signup?email=${encodeURIComponent(order.guest_email || '')}`}
                    className="block w-full text-center py-2.5 bg-[#c46331] hover:bg-[#b05325] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors"
                  >
                    Create Account in 1-Click →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-stone-500">Loading Order Tracker...</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}

