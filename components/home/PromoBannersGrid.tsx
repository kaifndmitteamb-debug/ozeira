'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { PromoBanner } from '@/types';
import { ScrollReveal } from '@/components/common/ScrollReveal';

interface PromoBannersGridProps {
  banners: PromoBanner[];
}

export function PromoBannersGrid({ banners }: PromoBannersGridProps) {
  const activeBanners = (banners || []).filter((b) => b.is_active).sort((a, b) => a.sort_order - b.sort_order);

  const halfBanners = activeBanners.filter((b) => b.grid_type === 'half');
  const thirdBanners = activeBanners.filter((b) => b.grid_type === 'third');

  return (
    <section className="py-16 sm:py-20 bg-[#fdfbf9] dark:bg-[#000000] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* 2-Column Spotlight Grid with ScrollReveal */}
        {halfBanners.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {halfBanners.map((banner, idx) => (
              <ScrollReveal key={banner.id} direction="up" delay={idx * 120}>
                <Link
                  href={banner.link_url || '/shop'}
                  className="group relative h-[380px] sm:h-[450px] rounded-3xl overflow-hidden shadow-md hover:shadow-luxury-lg dark:hover:shadow-zblack-elevated transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] transform hover:-translate-y-2 flex flex-col justify-end p-6 sm:p-10 cursor-pointer block smooth-gpu"
                >
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-108"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500 group-hover:opacity-95" />

                  <div className="relative z-10 space-y-2.5 text-white max-w-md">
                    {banner.badge_text && (
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-[#f5d480] bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 w-max">
                        <Sparkles className="w-3 h-3" /> {banner.badge_text}
                      </span>
                    )}
                    <h3 className="font-serif text-2xl sm:text-3xl font-bold leading-snug text-white tracking-tight">
                      {banner.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-stone-200 line-clamp-2 leading-relaxed">{banner.subtitle}</p>
                    <div className="pt-2">
                      <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white border-b-2 border-white/80 pb-0.5 group-hover:border-[#c46331] group-hover:text-[#c46331] transition-colors duration-300">
                        Discover Collection <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}

        {/* 3-Column Promo Grid with Staggered ScrollReveal */}
        {thirdBanners.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {thirdBanners.map((banner, idx) => (
              <ScrollReveal key={banner.id} direction="up" delay={idx * 100}>
                <Link
                  href={banner.link_url || '/shop'}
                  className="group relative h-[300px] sm:h-[350px] rounded-3xl overflow-hidden shadow-md hover:shadow-luxury-lg dark:hover:shadow-zblack-elevated transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] transform hover:-translate-y-2 flex flex-col justify-end p-6 cursor-pointer block smooth-gpu"
                >
                  <img
                    src={banner.image_url}
                    alt={banner.title}
                    className="absolute inset-0 w-full h-full object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-108"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-500 group-hover:opacity-95" />

                  <div className="relative z-10 space-y-2 text-white">
                    {banner.badge_text && (
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#f5d480] bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10 inline-block w-max">
                        {banner.badge_text}
                      </span>
                    )}
                    <h4 className="font-serif text-lg sm:text-xl font-bold text-white leading-tight">
                      {banner.title}
                    </h4>
                    <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">{banner.subtitle}</p>
                    <div className="pt-1.5">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-stone-200 group-hover:text-[#c46331] flex items-center gap-1.5 transition-colors duration-300">
                        Shop Now <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
