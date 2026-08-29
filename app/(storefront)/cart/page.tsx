'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  Truck,
  Sparkles,
  Tag,
  ShieldCheck,
  RefreshCw,
  Coins,
} from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { useAuth } from '@/lib/context/AuthContext';

export default function CartPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    items,
    itemCount,
    subtotal,
    couponDiscount,
    loyaltyDiscount,
    discountAmount,
    shippingFee,
    taxAmount,
    totalAmount,
    freeShippingThreshold,
    amountNeededForFreeShipping,
    updateQuantity,
    removeItem,
    clearCart,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    couponMessage,
    loyaltyPointsToUse,
    setLoyaltyPointsToUse,
    maxLoyaltyPointsAllowed,
    shippingMethod,
    setShippingMethod,
  } = useCart();
  const { formatAmount } = useCurrency();

  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');

  const progressPercent = Math.min(100, Math.round((subtotal / freeShippingThreshold) * 100));
  const userAvailablePoints = user?.loyalty_points || 0;
  const maxRedeemablePoints = Math.min(userAvailablePoints, maxLoyaltyPointsAllowed);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCodeInput.trim()) return;
    const res = applyCoupon(couponCodeInput.trim());
    if (res.success) {
      setCouponCodeInput('');
      setCouponError('');
    } else {
      setCouponError(res.message);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-20 h-20 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-400 dark:text-neutral-500">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-neutral-900 dark:text-neutral-100">Your Shopping Bag is Empty</h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
          Explore our timeless collections in bespoke knitwear, Tuscan leather, and fine jewelry.
        </p>
        <div className="pt-2">
          <Link
            href="/shop"
            className="inline-block px-8 py-3.5 bg-brand-amber hover:bg-brand-amber-dark text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-md transition-colors"
          >
            Explore Collection
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between pb-6 mb-8 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-brand-amber">
            Order Review
          </span>
          <h1 className="font-serif text-3xl font-bold text-neutral-900 dark:text-neutral-100 mt-1">
            Shopping Bag ({itemCount} {itemCount === 1 ? 'Piece' : 'Pieces'})
          </h1>
        </div>
        <button
          onClick={clearCart}
          className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold underline"
        >
          Clear Bag
        </button>
      </div>

      {/* Free shipping Progress */}
      <div className="p-4 bg-brand-amber/5 dark:bg-brand-amber/10 border border-brand-amber/20 rounded-2xl mb-8 text-xs">
        <div className="flex items-center justify-between font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
          <span className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-brand-amber" />
            {amountNeededForFreeShipping > 0
              ? `Add ${formatAmount(amountNeededForFreeShipping)} more to qualify for Complimentary Express Delivery`
              : '🎉 You have qualified for Complimentary Insured Express Shipping!'}
          </span>
          <span className="text-brand-amber font-bold">{progressPercent}%</span>
        </div>
        <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-brand-amber h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Line Items List (Col 8) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-[#14151a] p-6 shadow-sm">
            {items.map((item) => {
              const unitPrice =
                (item.product.sale_price ?? item.product.base_price) +
                (item.variant?.additional_price || 0);

              return (
                <div key={item.id} className="py-6 first:pt-0 last:pb-0 flex flex-col sm:flex-row gap-5">
                  <img
                    src={item.variant?.image_url || item.product.images?.[0]?.image_url || '/placeholder.jpg'}
                    alt={item.product.title}
                    className="w-24 h-32 object-cover rounded-xl bg-neutral-100 dark:bg-neutral-800 flex-shrink-0 border border-neutral-200 dark:border-neutral-700"
                  />

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-3">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                            {item.product.brand}
                          </span>
                          <Link
                            href={`/product/${item.product.slug}`}
                            className="block font-serif text-base font-bold text-neutral-900 dark:text-neutral-100 hover:text-brand-amber dark:hover:text-brand-amber transition-colors"
                          >
                            {item.product.title}
                          </Link>
                        </div>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {item.variant && (
                        <div className="flex items-center gap-3 text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                          {item.variant.size && <span>Size: <strong className="text-neutral-800 dark:text-neutral-200">{item.variant.size}</strong></span>}
                          {item.variant.color && <span>Color: <strong className="text-neutral-800 dark:text-neutral-200">{item.variant.color}</strong></span>}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden bg-white dark:bg-neutral-900">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="px-3 py-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold transition-colors"
                        >
                          -
                        </button>
                        <span className="px-3 text-xs font-bold text-neutral-900 dark:text-neutral-100">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="px-3 py-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-xs font-bold transition-colors"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                          {formatAmount(unitPrice * item.quantity)}
                        </span>
                        {item.quantity > 1 && (
                          <span className="block text-[11px] text-neutral-400 dark:text-neutral-500">
                            {formatAmount(unitPrice)} each
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Link
            href="/shop"
            className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 hover:text-brand-amber dark:hover:text-brand-amber transition-colors"
          >
            ← Continue Browsing Pieces
          </Link>
        </div>

        {/* Right: Order Summary & Loyalty & Checkout (Col 4) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Loyalty Points Redemption Wallet Card */}
          {user && (
            <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/10 border border-amber-200 dark:border-amber-900/40 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-brand-amber" />
                  <span>Loyalty Points Wallet</span>
                </span>
                <span className="font-bold text-amber-800 dark:text-amber-300 bg-amber-200/70 dark:bg-amber-900/50 px-2 py-0.5 rounded-full text-[11px]">
                  {userAvailablePoints} Pts Available
                </span>
              </div>

              {maxRedeemablePoints > 0 ? (
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-neutral-600 dark:text-neutral-400">
                    <span>Redeem for instant discount:</span>
                    <strong className="text-amber-900 dark:text-amber-300">{loyaltyPointsToUse} Pts (-{formatAmount(loyaltyDiscount)})</strong>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={maxRedeemablePoints}
                    step="50"
                    value={loyaltyPointsToUse}
                    onChange={(e) => setLoyaltyPointsToUse(Number(e.target.value))}
                    className="w-full accent-brand-amber cursor-pointer"
                  />
                  <div className="flex justify-between text-[11px] text-neutral-500 dark:text-neutral-400">
                    <span>0 Pts</span>
                    <span>Max {maxRedeemablePoints} Pts</span>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-neutral-600 dark:text-neutral-400">
                  Earn points automatically on this order! (10% back in wallet points).
                </p>
              )}
            </div>
          )}

          {/* Promo Voucher Card */}
          <div className="p-5 bg-white dark:bg-[#14151a] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-brand-amber" />
              <span>Promotional Voucher</span>
            </h3>

            {appliedCoupon ? (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-emerald-900 dark:text-emerald-300">Code: {appliedCoupon.code}</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    {appliedCoupon.description} (-{formatAmount(couponDiscount)})
                  </p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. LUXE10, FIRST500)"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-xl uppercase outline-none focus:border-brand-amber"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-900 hover:bg-brand-amber dark:bg-neutral-100 dark:hover:bg-brand-amber dark:text-neutral-900 text-white text-xs font-bold uppercase rounded-xl transition-colors"
                  >
                    Apply
                  </button>
                </div>
                {couponError && <p className="text-[11px] text-rose-600 dark:text-rose-400">{couponError}</p>}
              </form>
            )}
          </div>

          {/* Summary Breakdown Card */}
          <div className="p-6 bg-white dark:bg-[#14151a] border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100 pb-3 border-b border-neutral-100 dark:border-neutral-800">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">{formatAmount(subtotal)}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Coupon Voucher</span>
                  <span>-{formatAmount(couponDiscount)}</span>
                </div>
              )}

              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400 font-semibold">
                  <span>Loyalty Points ({loyaltyPointsToUse} pts)</span>
                  <span>-{formatAmount(loyaltyDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{subtotal >= freeShippingThreshold ? <strong className="text-emerald-700 dark:text-emerald-400 font-bold">FREE</strong> : formatAmount(shippingFee)}</span>
              </div>

              {taxAmount > 0 && (
                <div className="flex justify-between">
                  <span>Estimated Tax</span>
                  <span>{formatAmount(taxAmount)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline text-base font-bold text-neutral-900 dark:text-neutral-100 pt-3 border-t border-neutral-200 dark:border-neutral-800">
                <span>Total Amount</span>
                <span className="text-xl font-serif text-brand-amber">{formatAmount(totalAmount)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              className="w-full py-4 bg-brand-amber hover:bg-brand-amber-dark text-white text-xs font-bold uppercase tracking-widest rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-neutral-400 dark:text-neutral-500 pt-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Bank-grade 256-bit SSL encrypted checkout</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
