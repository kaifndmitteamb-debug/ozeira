'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, ShoppingBag, Trash2, ArrowRight, Truck, Check, Sparkles, Tag } from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';

export function MiniCartDrawer() {
  const router = useRouter();
  const {
    items,
    itemCount,
    subtotal,
    discountAmount,
    totalAmount,
    freeShippingThreshold,
    amountNeededForFreeShipping,
    isMiniCartOpen,
    closeMiniCart,
    updateQuantity,
    removeItem,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponMessage,
  } = useCart();
  const { formatAmount } = useCurrency();

  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState('');

  if (!isMiniCartOpen) return null;

  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    const res = applyCoupon(couponInput.trim());
    if (res.success) {
      setCouponInput('');
      setCouponError('');
    } else {
      setCouponError(res.message);
    }
  };

  const handleCheckoutClick = () => {
    closeMiniCart();
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden animate-fade-in">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        onClick={closeMiniCart}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 shadow-2xl flex flex-col justify-between animate-slide-up duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border-l border-neutral-200 dark:border-[#1a1a1a]">
          {/* Header */}
          <div className="p-5 border-b border-neutral-200 dark:border-[#1a1a1a] flex items-center justify-between bg-neutral-50 dark:bg-[#050505]">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#c46331]" />
              <h2 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">Your Shopping Bag</h2>
              <span className="bg-[#c46331]/15 text-[#c46331] text-xs font-bold px-2 py-0.5 rounded-full">
                {itemCount}
              </span>
            </div>
            <button
              onClick={closeMiniCart}
              className="p-2 rounded-full text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200 dark:hover:bg-[#151515] transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="p-4 bg-[#c46331]/5 dark:bg-[#c46331]/10 border-b border-[#c46331]/15 text-xs">
            <div className="flex items-center justify-between font-semibold mb-1.5">
              <span className="flex items-center gap-1.5 text-neutral-800 dark:text-neutral-200">
                <Truck className="w-4 h-4 text-[#c46331]" />
                {amountNeededForFreeShipping > 0
                  ? `Add ${formatAmount(amountNeededForFreeShipping)} more for Complimentary Express Shipping`
                  : '🎉 You have unlocked Complimentary Express Shipping!'}
              </span>
            </div>
            <div className="w-full bg-neutral-200 dark:bg-[#1a1a1a] rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-[#c46331] h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Line Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-neutral-100 dark:divide-[#1a1a1a]">
            {items.length > 0 ? (
              items.map((item) => {
                const unitPrice =
                  (item.product.sale_price ?? item.product.base_price) +
                  (item.variant?.additional_price || 0);

                return (
                  <div key={item.id} className="pt-4 first:pt-0 flex gap-4">
                    <img
                      src={item.variant?.image_url || item.product.images?.[0]?.image_url || '/placeholder.jpg'}
                      alt={item.product.title}
                      className="w-20 h-24 object-cover rounded-xl bg-neutral-100 dark:bg-[#000000] flex-shrink-0 border border-neutral-200 dark:border-[#1a1a1a]"
                    />
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <Link
                            href={`/product/${item.product.slug}`}
                            onClick={closeMiniCart}
                            className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 hover:text-brand-amber transition-colors line-clamp-2"
                          >
                            {item.product.title}
                          </Link>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="text-neutral-400 hover:text-red-500 p-1 transition-colors"
                            aria-label="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {item.variant && (
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {item.variant.size && `Size: ${item.variant.size}`}
                            {item.variant.size && item.variant.color && ' • '}
                            {item.variant.color && `Color: ${item.variant.color}`}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-neutral-100 dark:border-[#1a1a1a]">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-neutral-200 dark:border-[#1a1a1a] rounded-lg overflow-hidden">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="px-2.5 py-0.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#151515] text-xs font-bold"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-bold text-neutral-800 dark:text-neutral-200">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="px-2.5 py-0.5 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-[#151515] text-xs font-bold"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100">
                          {formatAmount(unitPrice * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 bg-neutral-100 dark:bg-[#111111] rounded-full flex items-center justify-center text-neutral-400">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-200">Your Bag is Empty</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xs">
                  Discover our timeless atelier pieces crafted with exceptional precision.
                </p>
                <Link
                  href="/shop"
                  onClick={closeMiniCart}
                  className="px-6 py-2.5 bg-brand-amber hover:bg-brand-amber-dark text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
                >
                  Explore Collection
                </Link>
              </div>
            )}
          </div>

          {/* Footer with Voucher and Totals */}
          {items.length > 0 && (
            <div className="p-5 border-t border-neutral-200 dark:border-[#1a1a1a] bg-neutral-50 dark:bg-[#050505] space-y-3">
              {/* Coupon input */}
              {appliedCoupon ? (
                <div className="flex items-center justify-between p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 rounded-lg text-xs">
                  <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 font-semibold">
                    <Tag className="w-3.5 h-3.5" />
                    <span>Coupon "{appliedCoupon.code}" applied</span>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-xs font-bold text-red-500 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Voucher code (e.g. LUXE10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-[#111111] border border-neutral-300 dark:border-[#222222] text-neutral-900 dark:text-neutral-100 rounded-lg uppercase outline-none focus:border-brand-amber"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-black dark:bg-[#1a1a1a] hover:bg-neutral-800 dark:hover:bg-[#252525] text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Apply
                  </button>
                </form>
              )}
              {couponError && <p className="text-[11px] text-red-500">{couponError}</p>}

              {/* Price Breakdown */}
              <div className="space-y-1.5 text-xs pt-2 border-t border-neutral-200 dark:border-[#1a1a1a]">
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Subtotal</span>
                  <span>{formatAmount(subtotal)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span>Discount</span>
                    <span>-{formatAmount(discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-neutral-600 dark:text-neutral-400">
                  <span>Shipping</span>
                  <span>{subtotal >= freeShippingThreshold ? 'FREE' : formatAmount(99)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-neutral-900 dark:text-neutral-100 pt-2 border-t border-neutral-200 dark:border-[#1a1a1a]">
                  <span>Estimated Total</span>
                  <span className="text-brand-amber">{formatAmount(totalAmount)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={handleCheckoutClick}
                  className="btn-luxury-shimmer w-full py-3.5 bg-[#c46331] hover:bg-[#df7b47] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-widest rounded-xl shadow-lg hover:shadow-[#c46331]/30 flex items-center justify-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Checkout Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <Link
                  href="/cart"
                  onClick={closeMiniCart}
                  className="block text-center py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-[#c46331] hover:underline transition-colors"
                >
                  View Full Cart & Redeem Points →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
