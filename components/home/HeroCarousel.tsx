'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Sparkles, ArrowRight } from 'lucide-react';
import { HeroBanner } from '@/types';
import { useLanguage } from '@/lib/context/CurrencyLanguageContext';

interface HeroCarouselProps {
  banners: HeroBanner[];
}

export function HeroCarousel({ banners }: HeroCarouselProps) {
  const { t } = useLanguage();
  const activeBanners = (banners || []).filter((b) => b.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (activeBanners.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeBanners.length, isPaused]);

  if (activeBanners.length === 0) return null;

  const current = activeBanners[currentIndex];

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? activeBanners.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
  };

  return (
    <section
      className="relative w-full overflow-hidden bg-black text-white min-h-[500px] sm:min-h-[580px] lg:min-h-[640px] flex items-center smooth-gpu"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Background Image with Dynamic Fade */}
      {activeBanners.map((banner, idx) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-0' : 'opacity-0 -z-10 pointer-events-none'
          }`}
        >
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover object-center transform scale-105 transition-transform duration-10000 ease-linear"
          />
          {/* Subtle gradient overlay for luxury readability */}
          <div
            className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-transparent"
            style={{ backgroundColor: `${banner.background_color}66` }}
          />
        </div>
      ))}

      {/* Hero Content Container */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="max-w-2xl space-y-5" key={current.id}>
          {current.badge_text && (
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-black/40 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold tracking-widest text-[#f5d480] uppercase shadow-sm animate-luxury-fade-up">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>{t('hero.badge', current.badge_text)}</span>
            </div>
          )}

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.12] drop-shadow-md animate-luxury-fade-up [animation-delay:180ms]">
            {current.title}
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-stone-200 font-light leading-relaxed max-w-xl drop-shadow animate-luxury-fade-up [animation-delay:320ms]">
            {current.subtitle}
          </p>

          <div className="pt-3 flex flex-wrap items-center gap-4 animate-luxury-fade-up [animation-delay:460ms]">
            <Link
              href={current.button_url || '/shop'}
              className="btn-luxury-shimmer px-8 py-4 bg-[#c46331] hover:bg-[#d4723c] active:scale-95 text-white text-xs sm:text-sm font-bold uppercase tracking-widest rounded-full shadow-xl hover:shadow-[#c46331]/30 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] transform hover:-translate-y-1 flex items-center gap-2.5 group smooth-gpu"
            >
              <span>{t('hero.explore_btn', current.button_text || 'Explore Collection')}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1.5" />
            </Link>

            <Link
              href="/shop"
              className="px-7 py-4 bg-black/30 hover:bg-black/50 active:scale-95 backdrop-blur-md border border-white/25 hover:border-white/40 text-white text-xs sm:text-sm font-semibold tracking-wider rounded-full transition-all duration-300 hover:-translate-y-0.5 shadow-sm"
            >
              {t('hero.lookbook_btn', 'View Lookbook')}
            </Link>
          </div>
        </div>
      </div>

      {/* Slide Navigation Arrows */}
      {activeBanners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            aria-label="Previous Slide"
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/65 active:scale-90 text-white backdrop-blur-md z-20 transition-all duration-300 hover:scale-110 shadow-lg cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next Slide"
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/65 active:scale-90 text-white backdrop-blur-md z-20 transition-all duration-300 hover:scale-110 shadow-lg cursor-pointer"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Slide Indicators / Dots with Progress Fill */}
      {activeBanners.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-2.5 z-20 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
          {activeBanners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-500 cursor-pointer ${
                currentIndex === idx ? 'w-8 bg-[#c46331] shadow-xs' : 'w-2 bg-white/40 hover:bg-white/80'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
