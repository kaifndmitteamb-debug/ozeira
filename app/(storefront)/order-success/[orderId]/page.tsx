'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DataStore } from '@/lib/store/data-store';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { formatDate } from '@/lib/utils';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  MapPin, 
  Download, 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  Printer
} from 'lucide-react';
import { Order, OrderStatus } from '@/types';
import Image from 'next/image';

const STATUS_STEPS = [
  { id: 'pending', label: 'Order Placed' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'shipped', label: 'Shipped' },
  { id: 'out_for_delivery', label: 'Out for Delivery' },
  { id: 'delivered', label: 'Delivered' }
];

export default function OrderSuccessPage() {
  const routeParams = useParams();
  const rawOrderId = routeParams?.orderId;
  const orderId = Array.isArray(rawOrderId) ? rawOrderId[0] : (rawOrderId as string) || '';
  const { formatAmount } = useCurrency();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    // Fetch order from DataStore
    const foundOrder = DataStore.getOrderById(orderId);
    setOrder(foundOrder || null);
    setLoading(false);
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 text-center animate-fade-in">
        <div className="relative mb-8">
          <div className="w-20 h-20 rounded-full border-4 border-amber-200/50 dark:border-amber-900/30 border-t-[#c46331] animate-spin flex items-center justify-center shadow-luxury-lg"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-7 h-7 text-[#c46331] animate-pulse" />
          </div>
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 mb-2 tracking-tight">
          Preparing Your Receipt...
        </h2>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto leading-relaxed">
          Fetching your confirmed order details and live tracking timeline from Ozeira Vault.
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 mb-6">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-3">
          Order Not Found
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mb-8 max-w-md">
          We couldn't retrieve the details for order #{orderId}. If you recently completed payment, it may take a few moments to synchronize.
        </p>
        <Link 
          href="/"
          className="bg-[#1a1714] text-white px-8 py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#c46331] transition-all shadow-md"
        >
          Return to Atelier
        </Link>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.id === order.status);
  const isCancelled = order.status === 'cancelled';
  const isReturned = order.status === 'returned';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16 animate-fade-in transition-colors">
      {/* Thank You Header Banner */}
      <div className="text-center mb-10 md:mb-14 space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 dark:bg-emerald-950/60 rounded-full mb-2 shadow-luxury-md">
          <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          Thank you for your order!
        </h1>
        <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-xl mx-auto leading-relaxed">
          We have received your order #{order.order_number} and our artisans are preparing your pieces for express insured shipment.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Order Details & Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Header Info */}
          <div className="bg-white dark:bg-[#1c1a17] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-6 border-b border-stone-100 dark:border-stone-800 gap-4">
              <div>
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">Order Number</p>
                <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">{order.order_number}</h2>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 mb-1">Date Placed</p>
                <p className="text-xs sm:text-sm font-medium text-stone-900 dark:text-stone-200">{formatDate(order.created_at)}</p>
              </div>
            </div>

            {/* Order Status Timeline */}
            {!isCancelled && !isReturned ? (
              <div className="py-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 mb-6">
                  Live Fulfillment Status
                </h3>
                <div className="relative">
                  <div className="absolute left-0 top-1/2 -mt-px w-full h-0.5 bg-stone-200 dark:bg-stone-700" aria-hidden="true" />
                  <div className="relative flex justify-between">
                    {STATUS_STEPS.map((step, index) => {
                      const isCompleted = currentStepIndex >= index;
                      const isCurrent = currentStepIndex === index;
                      
                      return (
                        <div key={step.id} className="flex flex-col items-center">
                          <div 
                            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center relative z-10 transition-colors ${
                              isCompleted 
                                ? 'bg-[#c46331] text-white ring-4 ring-white dark:ring-[#0a0a0a]' 
                                : 'bg-stone-200 dark:bg-[#141414] text-stone-400 dark:text-stone-500 ring-4 ring-white dark:ring-[#0a0a0a]'
                            }`}
                          >
                            {isCompleted ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : <div className="w-2 h-2 rounded-full bg-current" />}
                          </div>
                          <span className={`mt-2 text-[10px] sm:text-xs font-semibold text-center absolute top-8 sm:top-10 w-20 sm:w-24 -ml-7 sm:-ml-8 ${
                            isCurrent ? 'text-[#c46331] font-bold' : isCompleted ? 'text-stone-900 dark:text-stone-200' : 'text-stone-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="h-12" />
              </div>
            ) : (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 rounded-xl flex items-center gap-3 border border-rose-200 dark:border-rose-900/50">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs font-semibold">
                  This order has been {isCancelled ? 'cancelled' : 'returned'}.
                </span>
              </div>
            )}
          </div>

          {/* Ordered Items */}
          <div className="bg-white dark:bg-[#1c1a17] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 sm:p-8 shadow-xs">
            <h3 className="text-base font-bold font-serif text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#c46331]" />
              <span>Items in this Order ({order.items.length})</span>
            </h3>
            <div className="divide-y divide-stone-100 dark:divide-stone-800">
              {order.items.map((item) => (
                <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                  <div className="relative w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-800 flex-shrink-0 border border-stone-200 dark:border-stone-700">
                    <img
                      src={item.product_image}
                      alt={item.product_title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-center min-w-0">
                    <h4 className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100 truncate">{item.product_title}</h4>
                    {item.variant_details && (
                      <div className="text-xs text-stone-500 dark:text-stone-400 flex items-center gap-2 mt-0.5">
                        {item.variant_details.size && <span>Size: {item.variant_details.size}</span>}
                        {item.variant_details.size && item.variant_details.color && <span>•</span>}
                        {item.variant_details.color && <span>Color: {item.variant_details.color}</span>}
                      </div>
                    )}
                    <div className="text-xs text-stone-500 mt-1">Quantity: {item.quantity}</div>
                    <div className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 mt-1">
                      {formatAmount(item.unit_price)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Summary & Addresses */}
        <div className="space-y-6">
          {/* Order Summary Card */}
          <div className="bg-white dark:bg-[#1c1a17] rounded-2xl p-6 border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100">
              Payment Summary
            </h3>
            
            <div className="space-y-2.5 text-xs text-stone-600 dark:text-stone-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">{formatAmount(order.subtotal)}</span>
              </div>
              
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Discount {order.coupon_code ? `(${order.coupon_code})` : ''}</span>
                  <span>-{formatAmount(order.discount_amount)}</span>
                </div>
              )}
              
              {order.loyalty_discount_amount > 0 && (
                <div className="flex justify-between text-[#c46331] font-medium">
                  <span>Loyalty Discount</span>
                  <span>-{formatAmount(order.loyalty_discount_amount)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Shipping</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">{order.shipping_fee > 0 ? formatAmount(order.shipping_fee) : 'Complimentary'}</span>
              </div>
              
              {order.cod_fee > 0 && (
                <div className="flex justify-between">
                  <span>COD Handling</span>
                  <span>{formatAmount(order.cod_fee)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span>Tax (GST)</span>
                <span>{formatAmount(order.tax_amount)}</span>
              </div>
            </div>
            
            <div className="border-t border-stone-200 dark:border-stone-700 pt-4">
              <div className="flex justify-between items-center text-base font-bold text-stone-900 dark:text-stone-100 font-serif">
                <span>Total Paid</span>
                <span className="text-[#c46331]">{formatAmount(order.total_amount)}</span>
              </div>
            </div>

            <div className="bg-stone-50 dark:bg-stone-900 p-3.5 rounded-xl border border-stone-200 dark:border-stone-700 flex items-center gap-3">
              {order.payment_method === 'cod' ? (
                <Banknote className="w-5 h-5 text-[#c46331] shrink-0" />
              ) : (
                <CreditCard className="w-5 h-5 text-[#c46331] shrink-0" />
              )}
              <div className="text-xs">
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  {order.payment_method === 'cod' ? 'Cash on Delivery' : 'Online Payment (Razorpay)'}
                </p>
                <p className="text-stone-500 capitalize text-[11px]">
                  Payment Status: {order.payment_status}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white dark:bg-[#1c1a17] border border-stone-200 dark:border-stone-800 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#c46331]" />
              <span>Delivery Destination</span>
            </h3>
            
            <div className="text-xs text-stone-600 dark:text-stone-400 space-y-1">
              <p className="font-bold text-stone-900 dark:text-stone-100">{order.shipping_address.full_name}</p>
              <p>{order.shipping_address.street}</p>
              {order.shipping_address.apartment && <p>{order.shipping_address.apartment}</p>}
              <p>{order.shipping_address.city}, {order.shipping_address.state} - {order.shipping_address.postal_code}</p>
              <p>{order.shipping_address.country}</p>
              {order.shipping_address.phone && <p className="pt-1 text-stone-500">Contact: {order.shipping_address.phone}</p>}
            </div>

            {order.delivery_estimate && (
              <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl flex items-center gap-2.5 border border-amber-200 dark:border-amber-900/60 text-xs">
                <Truck className="w-4 h-4 text-[#c46331] flex-shrink-0" />
                <div>
                  <span className="font-bold text-amber-900 dark:text-amber-300">Estimated Delivery: </span>
                  <span className="text-amber-800 dark:text-amber-400">{order.delivery_estimate}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-12 flex flex-col sm:flex-row justify-center items-center gap-3.5">
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 rounded-xl bg-[#1a1714] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#c46331] transition-all shadow-md"
        >
          <ShoppingBag className="w-4 h-4 mr-2" />
          Continue Shopping
        </Link>
        <Link
          href={`/track-order?orderNumber=${order.order_number}&email=${encodeURIComponent(order.guest_email || order.shipping_address?.phone || '')}`}
          className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 rounded-xl bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 text-xs font-bold uppercase tracking-wider hover:border-[#c46331] hover:text-[#c46331] transition-all shadow-2xs"
        >
          <Truck className="w-4 h-4 mr-2" />
          Track Live Order
        </Link>
        <a
          href={`/api/invoice/${order.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800/60 text-xs font-bold uppercase tracking-wider hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-all shadow-2xs"
        >
          <Download className="w-4 h-4 mr-2 text-[#c46331]" />
          Download GST Invoice
        </a>
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3 rounded-xl bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 text-xs font-bold uppercase tracking-wider hover:bg-stone-50 dark:hover:bg-stone-800 transition-all shadow-2xs cursor-pointer"
        >
          <Printer className="w-4 h-4 mr-2" />
          Print Receipt
        </button>
      </div>
    </div>
  );
}
