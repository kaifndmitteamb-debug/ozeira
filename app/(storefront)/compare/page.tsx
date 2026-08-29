'use client';

import React from 'react';
import Link from 'next/link';
import { Scale, X, ShoppingBag, Star, Check, ArrowRight } from 'lucide-react';
import { useCompare } from '@/lib/context/CompareContext';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { useCart } from '@/lib/context/CartContext';

export default function ComparePage() {
  const { compareProducts, removeFromCompare, clearCompare } = useCompare();
  const { formatAmount } = useCurrency();
  const { addToCart } = useCart();

  if (compareProducts.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 bg-stone-100 dark:bg-stone-850 rounded-full flex items-center justify-center mx-auto text-stone-400">
          <Scale className="w-8 h-8" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">No Products in Comparison</h1>
        <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
          Add up to 4 pieces from our catalog using the scale icon to compare craftsmanship, materials, and specifications side by side.
        </p>
        <Link
          href="/shop"
          className="inline-block px-8 py-3 bg-[#c46331] text-white text-xs font-bold uppercase tracking-widest rounded-full hover:bg-[#a34c28] shadow-md transition-colors"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-[#c46331]">
            Side-by-Side Analysis
          </span>
          <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 mt-1">
            Compare Products ({compareProducts.length})
          </h1>
        </div>
        <button
          onClick={clearCompare}
          className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
        >
          Clear All Items
        </button>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-[#16171b] shadow-sm">
        <table className="w-full text-left divide-y divide-stone-200 dark:divide-stone-800">
          <thead>
            <tr className="divide-x divide-stone-100 dark:divide-stone-800">
              <th className="p-4 w-48 bg-stone-50 dark:bg-stone-900 text-xs font-bold text-stone-600 dark:text-stone-400 uppercase tracking-wider">
                Product Details
              </th>
              {compareProducts.map((p) => (
                <th key={p.id} className="p-4 min-w-[240px] max-w-[280px] align-top relative">
                  <button
                    onClick={() => removeFromCompare(p.id)}
                    className="absolute top-2 right-2 p-1 text-stone-400 hover:text-rose-600 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer"
                    title="Remove from comparison"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <img
                    src={p.images[0]?.image_url}
                    alt={p.title}
                    className="w-full aspect-[3/4] object-cover rounded-xl mb-3 bg-stone-100 dark:bg-stone-800"
                  />
                  <Link
                    href={`/product/${p.slug}`}
                    className="font-serif text-sm font-bold text-stone-900 dark:text-stone-100 hover:text-[#c46331] line-clamp-2"
                  >
                    {p.title}
                  </Link>
                  <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">{p.brand}</p>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-xs text-stone-700 dark:text-stone-300">
            {/* Price */}
            <tr className="divide-x divide-stone-100 dark:divide-stone-800">
              <td className="p-4 bg-stone-50 dark:bg-stone-900 font-bold text-stone-900 dark:text-stone-100">Price</td>
              {compareProducts.map((p) => (
                <td key={p.id} className="p-4">
                  <div className="flex items-baseline gap-2">
                    <span className="text-base font-bold text-stone-900 dark:text-stone-100">
                      {formatAmount(p.sale_price ?? p.base_price)}
                    </span>
                    {p.sale_price && (
                      <span className="text-xs text-stone-400 line-through">
                        {formatAmount(p.base_price)}
                      </span>
                    )}
                  </div>
                </td>
              ))}
            </tr>

            {/* Customer Rating */}
            <tr className="divide-x divide-stone-100 dark:divide-stone-800">
              <td className="p-4 bg-stone-50 dark:bg-stone-900 font-bold text-stone-900 dark:text-stone-100">Rating</td>
              {compareProducts.map((p) => (
                <td key={p.id} className="p-4">
                  <div className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{p.rating_avg.toFixed(1)}</span>
                    <span className="text-stone-400 font-normal">({p.review_count} reviews)</span>
                  </div>
                </td>
              ))}
            </tr>

            {/* Category */}
            <tr className="divide-x divide-stone-100 dark:divide-stone-800">
              <td className="p-4 bg-stone-50 dark:bg-stone-900 font-bold text-stone-900 dark:text-stone-100">Category</td>
              {compareProducts.map((p) => (
                <td key={p.id} className="p-4 font-medium">{p.category_name || 'Atelier'}</td>
              ))}
            </tr>

            {/* Stock Availability */}
            <tr className="divide-x divide-stone-100 dark:divide-stone-800">
              <td className="p-4 bg-stone-50 dark:bg-stone-900 font-bold text-stone-900 dark:text-stone-100">Availability</td>
              {compareProducts.map((p) => (
                <td key={p.id} className="p-4">
                  {p.total_stock > 0 ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> In Stock ({p.total_stock} available)
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 font-bold">Out of Stock</span>
                  )}
                </td>
              ))}
            </tr>

            {/* Available Sizes */}
            <tr className="divide-x divide-stone-100 dark:divide-stone-800">
              <td className="p-4 bg-stone-50 dark:bg-stone-900 font-bold text-stone-900 dark:text-stone-100">Sizes</td>
              {compareProducts.map((p) => (
                <td key={p.id} className="p-4">
                  {p.variants?.filter((v) => v.size).map((v) => v.size).join(', ') || 'One Size'}
                </td>
              ))}
            </tr>

            {/* Available Colors */}
            <tr className="divide-x divide-stone-100 dark:divide-stone-800">
              <td className="p-4 bg-stone-50 dark:bg-stone-900 font-bold text-stone-900 dark:text-stone-100">Colors</td>
              {compareProducts.map((p) => (
                <td key={p.id} className="p-4">
                  {p.variants?.filter((v) => v.color).map((v) => v.color).join(', ') || 'Single Finish'}
                </td>
              ))}
            </tr>

            {/* Material / Primary Spec */}
            <tr className="divide-x divide-stone-100 dark:divide-stone-800">
              <td className="p-4 bg-stone-50 dark:bg-stone-900 font-bold text-stone-900 dark:text-stone-100">Material & Build</td>
              {compareProducts.map((p) => (
                <td key={p.id} className="p-4 leading-relaxed">
                  {p.specifications?.Material ||
                    p.specifications?.Fabric ||
                    p.specifications?.Leather ||
                    p.specifications?.['Primary Stone'] ||
                    'Artisanal blend'}
                </td>
              ))}
            </tr>

            {/* Weight */}
            <tr className="divide-x divide-stone-100 dark:divide-stone-800">
              <td className="p-4 bg-stone-50 dark:bg-stone-900 font-bold text-stone-900 dark:text-stone-100">Weight</td>
              {compareProducts.map((p) => (
                <td key={p.id} className="p-4">{p.weight_grams} grams</td>
              ))}
            </tr>

            {/* Action Row */}
            <tr className="divide-x divide-stone-100 dark:divide-stone-800 bg-stone-50/50 dark:bg-stone-900/50">
              <td className="p-4 font-bold text-stone-900 dark:text-stone-100">Action</td>
              {compareProducts.map((p) => (
                <td key={p.id} className="p-4">
                  <button
                    onClick={() => addToCart(p)}
                    disabled={p.total_stock <= 0}
                    className="w-full py-2.5 px-4 bg-[#1a1714] dark:bg-stone-800 hover:bg-[#c46331] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>{p.total_stock > 0 ? 'Add to Bag' : 'Sold Out'}</span>
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
