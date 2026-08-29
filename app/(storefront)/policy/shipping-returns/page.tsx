'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DataStore } from '@/lib/store/data-store';
import type { CMSPage } from '@/types';
import { formatMarkdownToHtml, formatDate } from '@/lib/utils';
import { Truck, RefreshCw, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function ShippingReturnsPage() {
  const [page, setPage] = useState<CMSPage | null>(null);

  useEffect(() => {
    const data = DataStore.getCMSPageBySlug('shipping-returns');
    if (data) setPage(data);
  }, []);

  if (!page) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-xs text-stone-400">
        Loading policy...
      </div>
    );
  }

  return (
    <div className="bg-stone-50 dark:bg-[#0f1014] min-h-screen pb-20 transition-colors">
      <div className="bg-white dark:bg-[#16171b] py-14 px-4 text-center border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#c46331] mx-auto">
            <Truck className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {page.title}
          </h1>
          {page.updated_at && (
            <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
              Last Updated: {formatDate(page.updated_at)}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Value Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-4 bg-white dark:bg-[#16171b] rounded-2xl border border-stone-200 dark:border-stone-800 text-center">
            <Truck className="w-5 h-5 text-[#c46331] mx-auto mb-2" />
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">Express Insured</h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Complimentary on orders &gt; ₹1,999</p>
          </div>
          <div className="p-4 bg-white dark:bg-[#16171b] rounded-2xl border border-stone-200 dark:border-stone-800 text-center">
            <RefreshCw className="w-5 h-5 text-[#c46331] mx-auto mb-2" />
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">7-Day Replacement</h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Hassle-free size exchange</p>
          </div>
          <div className="p-4 bg-white dark:bg-[#16171b] rounded-2xl border border-stone-200 dark:border-stone-800 text-center">
            <ShieldCheck className="w-5 h-5 text-[#c46331] mx-auto mb-2" />
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">100% Refund Guarantee</h4>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">Original payment or bank transfer</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#16171b] p-8 sm:p-12 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-4">
          <div 
            className="prose-luxury"
            dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(page.content) }}
          />
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#c46331] hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Boutique</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
