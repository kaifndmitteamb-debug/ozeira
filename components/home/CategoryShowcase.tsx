'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Category } from '@/types';
import { useLanguage } from '@/lib/context/CurrencyLanguageContext';
import { ScrollReveal } from '@/components/common/ScrollReveal';

interface CategoryShowcaseProps {
  categories: Category[];
}

export function CategoryShowcase({ categories }: CategoryShowcaseProps) {
  const { t } = useLanguage();
  const activeCategories = (categories || []).filter((c) => c.is_active).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className="py-16 sm:py-24 bg-[#fdfbf9] dark:bg-[#000000] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with ScrollReveal */}
        <ScrollReveal direction="up" delay={50}>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#c46331] inline-block mb-1">
                {t('home.curated_universes', 'Curated Universes')}
              </span>
              <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                {t('home.explore_categories', 'Explore by Category')}
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300 hover:text-[#c46331] flex items-center gap-1.5 group transition-colors"
            >
              <span>{t('home.view_all_categories', 'View All Categories')}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>
          </div>
        </ScrollReveal>

        {/* Category Cards Grid with Staggered ScrollReveal */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {activeCategories.map((category, idx) => (
            <ScrollReveal key={category.id} direction="up" delay={100 + idx * 60}>
              <Link
                href={`/shop?category=${category.slug}`}
                className="group flex flex-col items-center text-center p-3.5 rounded-2xl bg-white dark:bg-[#0a0a0a] border border-stone-200/80 dark:border-[#1a1a1a] hover:border-[#c46331]/50 dark:hover:border-[#c46331]/60 hover:shadow-luxury-lg dark:hover:shadow-zblack-elevated transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] transform hover:-translate-y-2 smooth-gpu cursor-pointer block h-full"
              >
                <div className="aspect-square w-full rounded-xl overflow-hidden bg-stone-100 dark:bg-[#000000] mb-3 relative">
                  <img
                    src={category.image_url}
                    alt={category.name}
                    className="w-full h-full object-cover transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-stone-900 dark:text-stone-100 group-hover:text-[#c46331] transition-colors duration-300">
                  {category.name}
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  {category.item_count || 5}+ Pieces
                </p>
              </Link>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
