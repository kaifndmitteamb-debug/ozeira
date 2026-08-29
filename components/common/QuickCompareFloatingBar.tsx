'use client';

import React from 'react';
import Link from 'next/link';
import { Scale, X, ArrowRight } from 'lucide-react';
import { useCompare } from '@/lib/context/CompareContext';

export function QuickCompareFloatingBar() {
  const { compareProducts, count, removeFromCompare, clearCompare } = useCompare();

  if (count === 0) return null;

  return (
    <div className="fixed bottom-6 left-6 z-40 max-w-md w-full bg-[#1a1714] text-white rounded-2xl shadow-luxury-lg border border-stone-800 p-3.5 animate-slide-up">
      <div className="flex items-center justify-between gap-3">
        {/* Thumbnails of items being compared */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-stone-800 rounded-lg text-[#f5d480]">
            <Scale className="w-4 h-4" />
          </div>
          <div className="flex -space-x-2 overflow-hidden">
            {compareProducts.map((p) => (
              <div key={p.id} className="relative group">
                <img
                  src={p.images[0]?.image_url}
                  alt={p.title}
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-stone-900 object-cover"
                />
                <button
                  onClick={() => removeFromCompare(p.id)}
                  className="absolute -top-1 -right-1 bg-stone-700 hover:bg-rose-600 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
          <span className="text-xs font-semibold text-stone-300">
            {count} / 4 pieces
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={clearCompare}
            className="text-[11px] text-stone-400 hover:text-stone-200 underline"
          >
            Clear
          </button>
          <Link
            href="/compare"
            className="px-3.5 py-1.5 bg-[#c46331] hover:bg-[#df7b47] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-1 transition-colors shadow-sm"
          >
            <span>Compare</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
