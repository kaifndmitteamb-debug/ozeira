'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Product } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { useLanguage } from '@/lib/context/CurrencyLanguageContext';
import { ScrollReveal } from '@/components/common/ScrollReveal';

interface FeaturedProductTabsProps {
  products: Product[];
}

export function FeaturedProductTabs({ products }: FeaturedProductTabsProps) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'featured' | 'trending' | 'new' | 'bestseller'>('featured');

  let filteredProducts: Product[] = [];
  if (activeTab === 'featured') {
    filteredProducts = products.filter((p) => p.is_featured);
  } else if (activeTab === 'trending') {
    filteredProducts = products.filter((p) => p.is_trending);
  } else if (activeTab === 'new') {
    filteredProducts = products.filter((p) => p.is_new);
  } else {
    filteredProducts = [...products].sort((a, b) => b.review_count - a.review_count);
  }

  // Fallback if filter is empty
  if (filteredProducts.length === 0) {
    filteredProducts = products.slice(0, 8);
  }

  const tabs = [
    { id: 'featured', label: t('home.featured_pieces', 'Featured Pieces') },
    { id: 'trending', label: t('home.trending_now', 'Trending Now') },
    { id: 'new', label: t('home.new_arrivals', 'New Arrivals') },
    { id: 'bestseller', label: t('home.client_favorites', 'Client Favorites') },
  ] as const;

  return (
    <section className="py-16 sm:py-24 bg-stone-50/70 dark:bg-[#050505] border-y border-stone-200/60 dark:border-[#1a1a1a] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with ScrollReveal */}
        <ScrollReveal direction="up" delay={50}>
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2.5">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-stone-200/80 dark:bg-[#111111] border border-transparent dark:border-[#222222] rounded-full text-[11px] font-bold uppercase tracking-widest text-[#c46331] shadow-xs">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Master Crafted</span>
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
              {t('home.selected_works', 'Selected Atelier Works')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 max-w-md mx-auto">
              Handcrafted with enduring elegance, generational durability, and ethical sourcing.
            </p>
          </div>
        </ScrollReveal>

        {/* Filter Tabs with ScrollReveal */}
        <ScrollReveal direction="up" delay={100}>
          <div className="flex items-center justify-center flex-wrap gap-2 sm:gap-3 mb-12">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] transform active:scale-95 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-md scale-105'
                    : 'bg-white dark:bg-[#0a0a0a] text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-[#151515] hover:text-stone-900 dark:hover:text-stone-100 border border-stone-200 dark:border-[#1a1a1a]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </ScrollReveal>

        {/* Product Cards Grid with Smooth Crossfade Animation */}
        <div
          key={activeTab}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-luxury-fade-up"
        >
          {filteredProducts.slice(0, 8).map((product, idx) => (
            <div
              key={product.id}
              className="animate-luxury-fade-up"
              style={{ animationDelay: `${idx * 70}ms` }}
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* View All CTA with ScrollReveal */}
        <ScrollReveal direction="up" delay={200}>
          <div className="mt-14 text-center">
            <Link
              href="/shop"
              className="btn-luxury-shimmer inline-flex items-center gap-2.5 px-9 py-4 bg-white dark:bg-[#0a0a0a] border border-stone-300 dark:border-[#222222] hover:border-black dark:hover:border-stone-400 text-stone-900 dark:text-stone-200 hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black rounded-full text-xs font-bold uppercase tracking-widest shadow-md hover:shadow-xl transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] transform hover:-translate-y-1 active:scale-95 group"
            >
              <span>Explore Complete Shop ({products.length} Pieces)</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
