'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DataStore } from '@/lib/store/data-store';
import { Leaf, Award, Zap, Building, Sparkles, ArrowRight } from 'lucide-react';
import type { CMSPage } from '@/types';
import { formatMarkdownToHtml } from '@/lib/utils';

export default function AboutPage() {
  const [page, setPage] = useState<CMSPage | null>(null);

  useEffect(() => {
    const data = DataStore.getCMSPageBySlug('about');
    if (data) setPage(data);
  }, []);

  return (
    <div className="bg-stone-50 dark:bg-[#0f1014] min-h-screen pb-20 transition-colors">
      {/* Hero Header */}
      <div className="bg-[#16171b] text-white py-20 px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden">
        <div className="max-w-3xl mx-auto space-y-4 relative z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#f5d480]">
            The Heritage & Craftsmanship
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight">
            {page?.title || 'The Story of Ozeira'}
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 max-w-xl mx-auto leading-relaxed">
            Where generational textile traditions converge with contemporary silhouette architecture and uncompromising conscious ethics.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        {/* Editorial Story Card */}
        <div className="bg-white dark:bg-[#16171b] p-8 sm:p-14 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm">
          {page?.content ? (
            <div 
              className="prose-luxury max-w-none"
              dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(page.content) }}
            />
          ) : (
            <div className="space-y-6 text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              <p className="text-base font-serif italic text-stone-800 dark:text-stone-200">
                "Luxury is not merely an ornament of vanity; it is the physical poetry of time, discipline, and human dignity."
              </p>
              <p>
                Founded on the belief that true refinement requires patience, Ozeira creates limited-edition artisanal garments, vegetable-tanned leather goods, fine heirloom jewelry, and handcrafted footwear. Each creation is produced in numbered small batches to guarantee zero industrial overproduction.
              </p>
              <p>
                From hand-selected Mulberry silks to certified ethical gold vermeil, our materials are chosen not just for their breathtaking initial radiance, but for how gracefully they age across generations.
              </p>
            </div>
          )}
        </div>

        {/* Pillars / Values */}
        <div>
          <div className="text-center max-w-xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-[#c46331] dark:text-amber-400">
              Our Pillars
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100">
              The Four Principles of Ozeira
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-8 rounded-3xl bg-white dark:bg-[#16171b] border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-[#c46331] flex items-center justify-center">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">Master Craftsmanship</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Hand-cut, hand-sewn, and finished by master artisans who have perfected their lineage of craft over decades.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-[#16171b] border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-[#c46331] flex items-center justify-center">
                <Leaf className="w-6 h-6" />
              </div>
              <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">Conscious Provenance</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Zero harmful chemicals, recyclable bespoke packaging, and certified living wages for every artisan in our supply chain.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-[#16171b] border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-[#c46331] flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">Limited Production</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                We craft only 50 to 150 pieces per collection, preserving the utmost rarity and preventing inventory waste.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-[#16171b] border border-stone-200 dark:border-stone-800 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-[#c46331] flex items-center justify-center">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">Lifelong Concierge</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">
                Complimentary repair consulting, size adjustments, and care restoration guidance for the lifespan of every creation.
              </p>
            </div>
          </div>
        </div>

        {/* CTA to Shop */}
        <div className="text-center pt-6">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 bg-[#1a1714] hover:bg-[#c46331] text-white px-8 py-3.5 rounded-full uppercase tracking-wider text-xs font-bold transition-all shadow-md"
          >
            <span>Explore The Current Collection</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
