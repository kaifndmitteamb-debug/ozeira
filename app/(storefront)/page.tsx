'use client';

import React from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';
import { useStore } from '@/lib/context/StoreContext';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { PromoBannersGrid } from '@/components/home/PromoBannersGrid';
import { CategoryShowcase } from '@/components/home/CategoryShowcase';
import { FeaturedProductTabs } from '@/components/home/FeaturedProductTabs';
import { ProductCatalogGrid } from '@/components/product/ProductCatalogGrid';
import { ScrollReveal } from '@/components/common/ScrollReveal';

export default function HomePage() {
  const { heroBanners, promoBanners, categories, products } = useStore();

  return (
    <div className="space-y-4 overflow-hidden">
      {/* Dynamic Hero Carousel */}
      <HeroCarousel banners={heroBanners} />

      {/* Trust Bar Highlights with ScrollReveal */}
      <ScrollReveal direction="up" delay={50}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-white dark:bg-[#16171b] rounded-3xl border border-stone-200/80 dark:border-stone-800 shadow-xs hover:shadow-luxury-lg dark:hover:shadow-luxury-dark transition-all duration-500 text-xs font-semibold text-stone-800 dark:text-stone-200">
            <div className="flex items-center gap-3 justify-center text-center sm:text-left p-2 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
              <Truck className="w-5 h-5 text-[#c46331] flex-shrink-0 animate-pulse-subtle" />
              <span>Complimentary Insured Shipping</span>
            </div>
            <div className="flex items-center gap-3 justify-center text-center sm:text-left p-2 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
              <RefreshCw className="w-5 h-5 text-[#c46331] flex-shrink-0 animate-pulse-subtle" />
              <span>7-Day Easy Doorstep Returns</span>
            </div>
            <div className="flex items-center gap-3 justify-center text-center sm:text-left p-2 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
              <Award className="w-5 h-5 text-[#c46331] flex-shrink-0 animate-pulse-subtle" />
              <span>Generational Craftsmanship</span>
            </div>
            <div className="flex items-center gap-3 justify-center text-center sm:text-left p-2 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
              <ShieldCheck className="w-5 h-5 text-[#c46331] flex-shrink-0 animate-pulse-subtle" />
              <span>Secure Tokenized Payments</span>
            </div>
          </div>
        </div>
      </ScrollReveal>

      {/* Promotional Split Banners */}
      <PromoBannersGrid banners={promoBanners} />

      {/* Category Showcase */}
      <CategoryShowcase categories={categories} />

      {/* Featured / Trending / New Tabs */}
      <FeaturedProductTabs products={products} />

      {/* Full Catalog with Live Filters & Search Section */}
      <section className="py-16 sm:py-24 bg-[#fdfbf9] dark:bg-[#0c0d10] transition-colors overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal direction="up" delay={50}>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#c46331] inline-block mb-1">
                  Complete Catalogue
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
                  Shop The Full Atelier Collection
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-sm">
                Use the live filters below to browse our pieces by size, color, rating, price, and category.
              </p>
            </div>
          </ScrollReveal>

          <ProductCatalogGrid products={products} categories={categories} />
        </div>
      </section>

      {/* Brand Heritage Editorial Banner with ScrollReveal */}
      <section className="py-20 sm:py-28 bg-[#16171d] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <ScrollReveal direction="left" delay={100}>
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest text-[#f5d480] shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                  <span>The Ozeira Standard</span>
                </div>
                <h2 className="font-serif text-3xl sm:text-5xl font-bold leading-[1.15] tracking-tight">
                  Designed for those who appreciate the poetry of craftsmanship.
                </h2>
                <p className="text-stone-300 text-xs sm:text-sm leading-relaxed max-w-lg">
                  Every piece is the result of hundreds of hours of painstaking manual refinement. From the selection of full-grain Tuscan hides to hand-stitched 360° Goodyear storm welts, we design pieces built to endure decades, not trends.
                </p>
                <div className="pt-2 flex flex-wrap gap-4">
                  <Link
                    href="/about"
                    className="btn-luxury-shimmer px-7 py-3.5 bg-[#c46331] hover:bg-[#df7b47] active:scale-95 text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-lg hover:shadow-[#c46331]/30 transition-all duration-300 transform hover:-translate-y-0.5"
                  >
                    Read Atelier Story
                  </Link>
                  <Link
                    href="/shop"
                    className="px-7 py-3.5 bg-white/10 hover:bg-white/20 active:scale-95 border border-white/30 hover:border-white/50 text-white text-xs font-semibold tracking-wider rounded-full transition-all duration-300 hover:-translate-y-0.5"
                  >
                    View Lookbook
                  </Link>
                </div>
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right" delay={150}>
              <div className="grid grid-cols-2 gap-4 sm:gap-6">
                <div className="overflow-hidden rounded-3xl shadow-2xl transform translate-y-4 group">
                  <img
                    src="https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=600"
                    alt="Leather Craftsmanship"
                    className="h-72 w-full object-cover transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-108"
                    loading="lazy"
                  />
                </div>
                <div className="overflow-hidden rounded-3xl shadow-2xl transform -translate-y-4 group">
                  <img
                    src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=80&w=600"
                    alt="Fine Jewelry Details"
                    className="h-72 w-full object-cover transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-108"
                    loading="lazy"
                  />
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
}
