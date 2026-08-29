'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/context/CartContext';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { CheckCircle2, ShoppingBag, ArrowRight, X } from 'lucide-react';

export default function AddToCartToast() {
  const { toastItem, dismissToast, openMiniCart } = useCart();
  const { formatAmount } = useCurrency();

  if (!toastItem) return null;

  const { product, variant, quantity } = toastItem;
  const image = variant?.image_url || product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=300';
  const price = (product.sale_price ?? product.base_price) + (variant?.additional_price || 0);

  return (
    <div className="fixed top-20 right-4 sm:right-8 z-50 max-w-sm w-full animate-bounce-in">
      <div className="bg-white/95 dark:bg-[#1c1a17]/95 backdrop-blur-md border border-stone-200/80 dark:border-stone-800/80 shadow-2xl rounded-2xl p-4 text-stone-900 dark:text-stone-100">
        {/* Header line */}
        <div className="flex items-center justify-between pb-2.5 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
            <CheckCircle2 className="w-4 h-4" />
            <span>Added to Bespoke Bag</span>
          </div>
          <button
            onClick={dismissToast}
            className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-0.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Item details */}
        <div className="flex items-center gap-3.5 my-3">
          <img
            src={image}
            alt={product.title}
            className="w-14 h-16 object-cover rounded-xl bg-stone-100 dark:bg-stone-800 border border-stone-200/60 dark:border-stone-700/60 flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate font-serif">{product.title}</h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
              Qty: {quantity} {variant?.size && `• Size: ${variant.size}`}
            </p>
            <p className="text-xs font-bold text-[#c46331] mt-1">{formatAmount(price * quantity)}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => {
              dismissToast();
              openMiniCart();
            }}
            className="flex-1 py-2 px-3 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>View Bag</span>
          </button>
          <Link
            href="/checkout"
            onClick={dismissToast}
            className="flex-1 py-2 px-3 bg-[#c46331] hover:bg-[#a34c28] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
          >
            <span>Checkout</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
