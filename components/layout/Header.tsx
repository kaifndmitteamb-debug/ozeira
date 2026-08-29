'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  ShoppingBag,
  Heart,
  Scale,
  User,
  Menu,
  X,
  ChevronDown,
  Globe,
  Sparkles,
  ShieldCheck,
  LogOut,
  Sliders,
  ExternalLink,
  Sun,
  Moon,
  Package,
  Settings,
  Clock,
  TrendingUp,
  ArrowRight,
  Lightbulb,
  Tag,
} from 'lucide-react';
import { useStore } from '@/lib/context/StoreContext';
import { useCart } from '@/lib/context/CartContext';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useCompare } from '@/lib/context/CompareContext';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useTheme } from '@/lib/context/ThemeContext';
import { Product } from '@/types';
import {
  fuzzySearchProducts,
  getMatchingCategories,
  getRecentSearches,
  saveRecentSearch,
  clearRecentSearches,
  POPULAR_SEARCH_TERMS,
} from '@/lib/utils/search-matcher';

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { announcement, categories, products, settings } = useStore();
  const { itemCount, openMiniCart } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { count: compareCount } = useCompare();
  const { currency, currencies, setCurrencyCode, formatAmount, language, languages, setLanguage, t, isAutoDetected, detectedCountry } = useCurrency();
  const { user, isAuthenticated, isAdmin, isOrderManager, logout, login } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [announcementVisible, setAnnouncementVisible] = useState(true);

  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Dynamic fuzzy search suggestions with typo tolerance and scoring
  const fuzzySearchData = useMemo(() => {
    if (!searchQuery.trim()) {
      return { results: [], matchedScores: new Map<string, number>(), didYouMean: undefined };
    }
    return fuzzySearchProducts(products, searchQuery);
  }, [products, searchQuery]);

  // Matching categories & subcategories
  const matchedCategories = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return getMatchingCategories(categories, searchQuery);
  }, [categories, searchQuery]);

  const executeSearch = (query: string) => {
    const clean = query.trim();
    if (clean) {
      const updated = saveRecentSearch(clean);
      setRecentSearches(updated);
      setSearchFocused(false);
      setMobileMenuOpen(false);
      router.push(`/shop?q=${encodeURIComponent(clean)}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  return (
    <header className="w-full sticky top-0 z-40 transition-all duration-300">
      {/* Announcement Bar */}
      {announcement?.is_active && announcementVisible && (
        <div
          style={{ backgroundColor: announcement.bg_color || '#1a1816', color: announcement.text_color || '#f5d480' }}
          className="relative text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center transition-all"
        >
          {announcement.link_url ? (
            <Link href={announcement.link_url} className="hover:underline flex items-center gap-1.5 mx-auto">
              {announcement.text}
            </Link>
          ) : (
            <span className="mx-auto">{announcement.text}</span>
          )}
          <button
            onClick={() => setAnnouncementVisible(false)}
            className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 p-1"
            aria-label="Dismiss announcement"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Navigation Bar */}
      <nav
        className={`w-full border-b transition-all duration-300 ${
          isScrolled
            ? 'bg-white/95 dark:bg-black/95 backdrop-blur-md border-stone-200/80 dark:border-[#1a1a1a] shadow-sm py-3'
            : 'bg-[#fdfbf9] dark:bg-black border-stone-200/50 dark:border-[#1a1a1a] py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-3 lg:gap-5">
          {/* Mobile Menu Button & Brand */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-stone-100 dark:hover:bg-[#151515] text-stone-800 dark:text-stone-200"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            <Link href="/" className="flex items-center gap-2 group">
              <span className="font-serif text-2xl sm:text-3xl font-bold tracking-widest text-[#1a1714] dark:text-[#f2ece4] uppercase transition-colors group-hover:text-[#c46331] dark:group-hover:text-amber-400">
                {settings?.general?.storeName || 'Ozeira'}
              </span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-[#c46331] dark:bg-amber-400 mb-1"></span>
            </Link>
          </div>

          {/* Desktop Clean Navigation */}
          <div className="hidden lg:flex items-center space-x-5 xl:space-x-7 text-xs font-semibold uppercase tracking-widest text-stone-700 dark:text-stone-300 flex-shrink-0">
            <Link
              href="/shop"
              className={`hover:text-[#c46331] dark:hover:text-amber-400 transition-colors py-1 ${
                pathname === '/shop' ? 'text-[#c46331] dark:text-amber-400 border-b-2 border-[#c46331] dark:border-amber-400' : ''
              }`}
            >
              {t('nav.shop_all', 'Shop All')}
            </Link>
            <Link
              href="/about"
              className={`hover:text-[#c46331] dark:hover:text-amber-400 transition-colors py-1 ${
                pathname === '/about' ? 'text-[#c46331] dark:text-amber-400 border-b-2 border-[#c46331] dark:border-amber-400' : ''
              }`}
            >
              {t('nav.atelier_story', 'Atelier Story')}
            </Link>
            <Link
              href="/track-order"
              className={`hover:text-[#c46331] dark:hover:text-amber-400 transition-colors py-1 ${
                pathname === '/track-order' ? 'text-[#c46331] dark:text-amber-400 border-b-2 border-[#c46331] dark:border-amber-400' : ''
              }`}
            >
              {t('nav.track_order', 'Track Order')}
            </Link>
            <Link
              href="/contact"
              className={`hover:text-[#c46331] dark:hover:text-amber-400 transition-colors py-1 ${
                pathname === '/contact' ? 'text-[#c46331] dark:text-amber-400 border-b-2 border-[#c46331] dark:border-amber-400' : ''
              }`}
            >
              Contact Us
            </Link>
            <Link
              href="/faq"
              className={`hover:text-[#c46331] dark:hover:text-amber-400 transition-colors py-1 ${
                pathname === '/faq' ? 'text-[#c46331] dark:text-amber-400 border-b-2 border-[#c46331] dark:border-amber-400' : ''
              }`}
            >
              FAQ
            </Link>
          </div>

          {/* Search Bar with Live Dynamic Suggestions & Typo Tolerance */}
          <div ref={searchRef} className="relative w-48 sm:w-56 md:w-64 lg:w-72 flex-shrink-0 hidden sm:block">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder={t('nav.search_placeholder', 'Search luxury pieces, jewelry, boots...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                className="w-full pl-9 pr-8 py-2 text-xs bg-stone-100 dark:bg-[#0a0a0a] border border-stone-200/80 dark:border-[#1a1a1a] focus:border-[#c46331] dark:focus:border-amber-400 focus:bg-white dark:focus:bg-[#000000] rounded-full transition-all outline-none text-stone-800 dark:text-stone-200 placeholder-stone-400 dark:placeholder-stone-500 shadow-xs"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Autocomplete Popover with Dynamic Suggestions & Spell Correction */}
            {searchFocused && (
              <div className="absolute top-full right-0 mt-2 w-[340px] sm:w-[420px] max-w-[calc(100vw-32px)] bg-white dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#1a1a1a] rounded-2xl shadow-luxury-lg dark:shadow-zblack-elevated z-50 overflow-hidden animate-slide-up max-h-[480px] overflow-y-auto">
                {/* 1. When Input is Empty: Show Recent Searches & Trending Curation */}
                {!searchQuery.trim() ? (
                  <div className="p-4 space-y-4 text-xs">
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                          <span className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-stone-400" /> Recent Searches
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              clearRecentSearches();
                              setRecentSearches([]);
                            }}
                            className="hover:text-stone-700 dark:hover:text-stone-300 normal-case font-normal hover:underline text-[11px]"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {recentSearches.map((term, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => {
                                setSearchQuery(term);
                                executeSearch(term);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-amber-500/10 hover:text-[#c46331] dark:hover:text-amber-400 transition-colors flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                            >
                              <Clock className="w-2.5 h-2.5 opacity-60" />
                              {term}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Popular / Trending Searches */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                        <TrendingUp className="w-3 h-3 text-[#c46331] dark:text-amber-400" /> Trending Curation
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {POPULAR_SEARCH_TERMS.slice(0, 6).map((term, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              setSearchQuery(term);
                              executeSearch(term);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-[#c46331] hover:text-[#c46331] dark:hover:text-amber-400 transition-all text-[11px] font-medium cursor-pointer"
                          >
                            {term}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Explore Categories Shortcuts */}
                    <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                      <div className="text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">
                        Explore Categories
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-[11px]">
                        {categories.slice(0, 4).map((c) => (
                          <Link
                            key={c.id}
                            href={`/shop?category=${c.slug}`}
                            onClick={() => setSearchFocused(false)}
                            className="p-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-medium truncate flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-[#c46331]"></span>
                            {c.name}
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 2. When User Types: Show Suggestions, Typo Correction & Live Results */
                  <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                    {/* Typo Correction / Did You Mean Banner */}
                    {fuzzySearchData.didYouMean && (
                      <div className="p-2.5 bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/20 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-stone-700 dark:text-stone-300">
                          <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                          <span>
                            Did you mean:{' '}
                            <button
                              type="button"
                              onClick={() => {
                                setSearchQuery(fuzzySearchData.didYouMean!);
                                executeSearch(fuzzySearchData.didYouMean!);
                              }}
                              className="font-bold text-[#c46331] dark:text-amber-400 underline underline-offset-2 hover:opacity-80 cursor-pointer"
                            >
                              "{fuzzySearchData.didYouMean}"
                            </button>
                            ?
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Matching Categories Quick Jump */}
                    {matchedCategories.length > 0 && (
                      <div className="p-2 bg-stone-50/70 dark:bg-stone-800/40">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500 mb-1 px-1">
                          Matching Collections
                        </div>
                        {matchedCategories.map((mc, idx) => (
                          <Link
                            key={idx}
                            href={
                              mc.subcategory
                                ? `/shop?category=${mc.category.slug}&subcategory=${mc.subcategory.slug}`
                                : `/shop?category=${mc.category.slug}`
                            }
                            onClick={() => setSearchFocused(false)}
                            className="flex items-center justify-between p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-800 dark:text-stone-200 transition-colors"
                          >
                            <span className="flex items-center gap-1.5 font-semibold text-xs">
                              <Tag className="w-3 h-3 text-[#c46331]" />
                              {mc.subcategory ? `${mc.category.name} → ${mc.subcategory.name}` : mc.category.name}
                            </span>
                            <ArrowRight className="w-3 h-3 text-stone-400" />
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Live Matching Product Items */}
                    {fuzzySearchData.results.length > 0 ? (
                      <div>
                        <div className="p-2 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                          Suggested Pieces ({fuzzySearchData.results.length})
                        </div>
                        <div className="divide-y divide-stone-100 dark:divide-stone-800">
                          {fuzzySearchData.results.slice(0, 5).map((p) => (
                            <Link
                              key={p.id}
                              href={`/product/${p.slug}`}
                              onClick={() => {
                                saveRecentSearch(searchQuery);
                                setSearchFocused(false);
                              }}
                              className="flex items-center gap-3 p-2.5 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors group"
                            >
                              <img
                                src={p.images[0]?.image_url}
                                alt={p.title}
                                className="w-10 h-10 object-cover rounded-lg bg-stone-100 dark:bg-stone-800 flex-shrink-0 group-hover:scale-105 transition-transform"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-stone-900 dark:text-stone-100 truncate group-hover:text-[#c46331] dark:group-hover:text-amber-400 transition-colors">
                                  {p.title}
                                </p>
                                <p className="text-[11px] text-stone-400 truncate">{p.category_name} • {p.brand}</p>
                              </div>
                              <div className="text-xs font-bold text-[#c46331] dark:text-amber-400">
                                {formatAmount(p.sale_price ?? p.base_price)}
                              </div>
                            </Link>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => executeSearch(searchQuery)}
                          className="w-full text-center py-2.5 text-xs font-bold text-[#c46331] dark:text-amber-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          View all {fuzzySearchData.results.length} results for "{searchQuery}" <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-5 text-center space-y-2">
                        <p className="text-xs font-medium text-stone-600 dark:text-stone-300">
                          No exact pieces found for "{searchQuery}".
                        </p>
                        <p className="text-[11px] text-stone-400">
                          Try searching for <span className="font-semibold text-stone-600 dark:text-stone-300">"trench coat"</span>, <span className="font-semibold text-stone-600 dark:text-stone-300">"leather bag"</span>, or <span className="font-semibold text-stone-600 dark:text-stone-300">"emerald ring"</span>.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Currency & Language Switcher Dropdown */}
            {/* Currency & Language Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setCurrencyDropdownOpen(!currencyDropdownOpen)}
                className="flex items-center gap-1.5 text-xs font-semibold text-stone-700 dark:text-stone-300 hover:text-[#c46331] p-1.5 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                title="Change Currency & Language"
              >
                <Globe className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
                <span>{currency.code}</span>
                <ChevronDown className="w-3 h-3 text-stone-400 dark:text-stone-500" />
              </button>

              {currencyDropdownOpen && (
                <div className="notranslate absolute right-0 mt-2 w-52 bg-white dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#1a1a1a] rounded-xl shadow-luxury-lg dark:shadow-zblack-elevated p-2 z-50 animate-slide-up text-xs">
                  <div className="px-2 py-1 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider">
                    Select Currency
                  </div>
                  <div className="space-y-1 mb-2">
                    {currencies.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          setCurrencyCode(c.code);
                          setCurrencyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between cursor-pointer ${
                          currency.code === c.code ? 'bg-stone-100 dark:bg-[#151515] font-semibold text-[#c46331]' : 'hover:bg-stone-50 dark:hover:bg-[#151515] text-stone-800 dark:text-stone-200'
                        }`}
                      >
                        <span>
                          {c.code} ({c.symbol})
                        </span>
                        <span className="text-[11px] text-stone-400 dark:text-stone-500">{c.name}</span>
                      </button>
                    ))}
                  </div>

                  <div className="px-2 py-1 text-[10px] font-bold text-stone-400 dark:text-stone-500 uppercase tracking-wider border-t border-stone-100 dark:border-[#1a1a1a] pt-2">
                    Select Language
                  </div>
                  <div className="space-y-1">
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLanguage(l.code);
                          setCurrencyDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between cursor-pointer ${
                          language === l.code ? 'bg-stone-100 dark:bg-[#151515] font-semibold text-[#c46331]' : 'hover:bg-stone-50 dark:hover:bg-[#151515] text-stone-800 dark:text-stone-200'
                        }`}
                      >
                        <span>{l.name}</span>
                        <span className="text-[11px] text-stone-400 dark:text-stone-500 font-medium">{l.nativeName}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Compare Button */}
            <Link
              href="/compare"
              className="relative p-2 text-stone-700 dark:text-stone-300 hover:text-[#c46331] dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-[#151515] rounded-full transition-all duration-300 hover:scale-110 active:scale-90 hidden sm:flex cursor-pointer"
              title="Compare Products"
            >
              <Scale className="w-4 h-4" />
              {compareCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-stone-800 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scale-in">
                  {compareCount}
                </span>
              )}
            </Link>

            {/* Wishlist Button */}
            <Link
              href="/account/wishlist"
              className="relative p-2 text-stone-700 dark:text-stone-300 hover:text-[#c46331] dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-[#151515] rounded-full transition-all duration-300 hover:scale-110 active:scale-90 cursor-pointer"
              title="Wishlist"
            >
              <Heart className="w-4 h-4" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-scale-in">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 text-stone-700 dark:text-stone-300 hover:text-[#c46331] dark:hover:text-amber-400 hover:bg-stone-100 dark:hover:bg-[#151515] rounded-full transition-all duration-300 hover:scale-115 active:scale-90 hover:rotate-12 cursor-pointer"
              title={resolvedTheme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle theme mode"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400 animate-scale-in" />
              ) : (
                <Moon className="w-4 h-4 text-stone-700 animate-scale-in" />
              )}
            </button>

            {/* User Account / Auth Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-[#151515] text-stone-800 dark:text-stone-200 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-700 overflow-hidden flex items-center justify-center text-xs font-semibold text-stone-700 dark:text-stone-200">
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={user.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>
                <span className="text-xs font-medium hidden md:inline-block max-w-[100px] truncate">
                  {user ? user.full_name.split(' ')[0] : 'Sign In'}
                </span>
                <ChevronDown className="w-3 h-3 text-stone-400 hidden md:inline-block" />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0a0a0a] border border-stone-200 dark:border-[#1a1a1a] rounded-xl shadow-luxury-lg dark:shadow-zblack-elevated p-2 z-50 animate-slide-up text-xs">
                  {user ? (
                    <div>
                      <div className="p-2.5 bg-stone-50 dark:bg-stone-900 rounded-lg mb-2">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold text-stone-900 dark:text-stone-100 truncate">{user.full_name}</p>
                          {user.role === 'admin' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300">
                              Owner
                            </span>
                          )}
                          {user.role === 'order_manager' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 dark:bg-blue-950 text-blue-900 dark:text-blue-300">
                              Staff
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">{user.email}</p>
                        {user.role === 'customer' && (
                          <div className="mt-2 flex items-center justify-between text-[11px] pt-1.5 border-t border-stone-200 dark:border-stone-800">
                            <span className="text-stone-600 dark:text-stone-400 font-medium">Loyalty Wallet:</span>
                            <span className="font-bold text-[#c46331] dark:text-amber-400">{user.loyalty_points} Pts</span>
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        {user.role === 'admin' || user.role === 'order_manager' ? (
                          <>
                            <Link
                              href="/admin"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center justify-between px-2.5 py-2 bg-[#1a1714] dark:bg-stone-800 text-white rounded-lg hover:bg-stone-800 dark:hover:bg-stone-700 font-bold mb-1"
                            >
                              <span className="flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Admin Dashboard
                              </span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                            <Link
                              href="/admin/orders"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md text-stone-700 dark:text-stone-300 font-medium"
                            >
                              <ShoppingBag className="w-3.5 h-3.5 text-[#c46331]" /> Orders & Shipments
                            </Link>
                            <Link
                              href="/admin/products"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md text-stone-700 dark:text-stone-300 font-medium"
                            >
                              <Package className="w-3.5 h-3.5 text-[#c46331]" /> Products & Inventory
                            </Link>
                            <Link
                              href="/admin/customers"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md text-stone-700 dark:text-stone-300 font-medium"
                            >
                              <User className="w-3.5 h-3.5 text-[#c46331]" /> Customer Directory
                            </Link>
                            <Link
                              href="/admin/settings"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-md text-stone-700 dark:text-stone-300 font-medium"
                            >
                              <Settings className="w-3.5 h-3.5 text-[#c46331]" /> Store Rules & Settings
                            </Link>
                          </>
                        ) : (
                          <>
                            <Link
                              href="/account"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-850 rounded-md text-stone-700 dark:text-stone-300"
                            >
                              <User className="w-3.5 h-3.5" /> Customer Dashboard
                            </Link>
                            <Link
                              href="/account/orders"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-850 rounded-md text-stone-700 dark:text-stone-300"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" /> Order History & Tracking
                            </Link>
                            <Link
                              href="/account/loyalty"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-850 rounded-md text-stone-700 dark:text-stone-300"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Points Wallet
                            </Link>
                            <Link
                              href="/account/referrals"
                              onClick={() => setUserDropdownOpen(false)}
                              className="flex items-center gap-2 px-2.5 py-1.5 hover:bg-stone-100 dark:hover:bg-stone-850 rounded-md text-stone-700 dark:text-stone-300"
                            >
                              <GiftIcon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" /> Refer & Earn ₹500
                            </Link>
                          </>
                        )}

                        <div className="border-t border-stone-100 dark:border-stone-800 pt-1 mt-1">
                          <button
                            onClick={() => {
                              logout();
                              setUserDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md font-medium cursor-pointer"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-2 space-y-2">
                      <p className="text-stone-600 dark:text-stone-400 mb-2">Access your bespoke wishlist, order tracking, and rewards.</p>
                      <Link
                        href="/auth/login"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block w-full text-center py-2 bg-[#1a1714] dark:bg-stone-800 text-white rounded-lg font-semibold hover:bg-stone-800 dark:hover:bg-stone-700 transition-colors"
                      >
                        Sign In / Register
                      </Link>
                      <div className="pt-2 border-t border-stone-100 dark:border-stone-800">
                        <Link
                          href="/track-order"
                          onClick={() => setUserDropdownOpen(false)}
                          className="block w-full text-center py-1.5 text-xs text-stone-700 dark:text-stone-300 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 rounded-md font-medium"
                        >
                          Track Your Order (Guest)
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mini-Cart Drawer Trigger */}
            <button
              onClick={openMiniCart}
              className="btn-luxury-shimmer relative flex items-center gap-2 bg-black dark:bg-[#111111] border border-white/10 dark:border-[#222222] text-white px-3.5 sm:px-4.5 py-2 rounded-full hover:bg-[#c46331] dark:hover:bg-[#c46331] transition-all duration-300 shadow-md hover:shadow-[#c46331]/30 active:scale-95 group cursor-pointer"
              aria-label="View Shopping Bag"
            >
              <ShoppingBag className="w-4 h-4 transition-transform duration-300 group-hover:scale-115" />
              <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline-block">Bag</span>
              <span className="bg-[#c46331] dark:bg-amber-500 group-hover:bg-white group-hover:text-[#1a1714] text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center transition-all duration-300 shadow-xs animate-scale-in">
                {itemCount}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-stone-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] p-4 animate-slide-down">
            <form onSubmit={handleSearchSubmit} className="relative mb-4">
              <input
                type="text"
                placeholder="Search collection..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-stone-100 dark:bg-[#111111] border border-stone-200 dark:border-[#222222] text-stone-900 dark:text-stone-100 rounded-lg placeholder-stone-400"
              />
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>

            <div className="space-y-3 font-semibold text-xs tracking-wider uppercase text-stone-800 dark:text-stone-200">
              <Link
                href="/shop"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 border-b border-stone-100 dark:border-[#1a1a1a]"
              >
                Shop All Collection
              </Link>
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/shop?category=${cat.slug}`}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-1.5 border-b border-stone-100 dark:border-[#1a1a1a]"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 border-b border-stone-100 dark:border-stone-800"
              >
                Atelier Story
              </Link>
              <Link
                href="/track-order"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 border-b border-stone-100 dark:border-stone-800"
              >
                Track Order
              </Link>
              <Link
                href="/compare"
                onClick={() => setMobileMenuOpen(false)}
                className="block py-1.5 border-b border-stone-100 dark:border-stone-800"
              >
                Product Compare ({compareCount})
              </Link>

              {/* Mobile Theme Toggle Row */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-stone-500 dark:text-stone-400 normal-case text-xs">Appearance</span>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 text-xs font-bold capitalize"
                >
                  {resolvedTheme === 'dark' ? (
                    <>
                      <Sun className="w-3.5 h-3.5 text-amber-400" /> Light Mode
                    </>
                  ) : (
                    <>
                      <Moon className="w-3.5 h-3.5 text-stone-700" /> Dark Mode
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}

function GiftIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V3.5a2.5 2.5 0 115 0V8m-5 0V3.5a2.5 2.5 0 10-5 0V8m-3.5 0h17a1 1 0 011 1v3.5a1 1 0 01-1 1h-17a1 1 0 01-1-1V9a1 1 0 011-1zm0 4.5h17v7.5a2 2 0 01-2 2h-13a2 2 0 01-2-2v-7.5z" />
    </svg>
  );
}
