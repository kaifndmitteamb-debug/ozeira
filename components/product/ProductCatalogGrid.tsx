'use client';

import React, { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  SlidersHorizontal,
  X,
  ChevronDown,
  LayoutGrid,
  Grid3X3,
  List,
  Search,
  RotateCcw,
  Check,
  Star,
} from 'lucide-react';
import { Product, Category } from '@/types';
import { ProductCard } from '@/components/product/ProductCard';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { fuzzySearchProducts, saveRecentSearch } from '@/lib/utils/search-matcher';

interface ProductCatalogGridProps {
  products: Product[];
  categories: Category[];
  initialCategory?: string;
  initialQuery?: string;
}

export function ProductCatalogGrid(props: ProductCatalogGridProps) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-neutral-400">Loading catalog...</div>}>
      <ProductCatalogGridContent {...props} />
    </Suspense>
  );
}

function ProductCatalogGridContent({
  products,
  categories,
  initialCategory,
  initialQuery,
}: ProductCatalogGridProps) {
  const searchParams = useSearchParams();
  const { formatAmount } = useCurrency();

  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory || searchParams.get('category') || 'all'
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(
    searchParams.get('subcategory') || 'all'
  );
  const [searchQuery, setSearchQuery] = useState<string>(
    initialQuery || searchParams.get('q') || ''
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [inStockOnly, setInStockOnly] = useState<boolean>(false);
  const [onSaleOnly, setOnSaleOnly] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(40000);
  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc' | 'rating' | 'popular'>('newest');
  const [viewMode, setViewMode] = useState<'grid-4' | 'grid-3' | 'list'>('grid-4');
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Synchronize state when URL search params change
  useEffect(() => {
    const cat = searchParams.get('category') || initialCategory || 'all';
    const sub = searchParams.get('subcategory') || 'all';
    const q = searchParams.get('q') || initialQuery || '';

    setSelectedCategory(cat);
    setSelectedSubcategory(sub);
    setSearchQuery(q);
    setCurrentPage(1);
  }, [searchParams, initialCategory, initialQuery]);

  // Extract unique filter options from products
  const availableBrands = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.brand).filter(Boolean)));
  }, [products]);

  const availableColors = useMemo(() => {
    const colors = new Set<string>();
    products.forEach((p) => {
      p.variants?.forEach((v) => {
        if (v.color) colors.add(v.color);
      });
    });
    return Array.from(colors);
  }, [products]);

  // Fuzzy search with typo tolerance and scoring
  const fuzzySearchData = useMemo(() => {
    if (!searchQuery.trim()) {
      return { results: products, matchedScores: new Map<string, number>(), didYouMean: undefined };
    }
    return fuzzySearchProducts(products, searchQuery);
  }, [products, searchQuery]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all') {
        const cat = categories.find((c) => c.slug === selectedCategory || c.id === selectedCategory);
        if (cat && p.category_id !== cat.id) return false;
        if (!cat && p.category_id !== selectedCategory) return false;
      }

      // Subcategory filter
      if (selectedSubcategory !== 'all') {
        const sub = categories
          .flatMap((c) => c.subcategories || [])
          .find((s) => s.slug === selectedSubcategory || s.id === selectedSubcategory);
        if (sub && p.subcategory_id !== sub.id) return false;
        if (!sub && p.subcategory_id !== selectedSubcategory) return false;
      }

      // Search Query filter with typo tolerance
      if (searchQuery.trim()) {
        if (!fuzzySearchData.matchedScores.has(p.id)) return false;
      }

      // Price filter
      const effectivePrice = p.sale_price ?? p.base_price;
      if (effectivePrice > maxPrice) return false;

      // Brand filter
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;

      // Color filter
      if (selectedColors.length > 0) {
        const hasColor = p.variants?.some((v) => v.color && selectedColors.includes(v.color));
        if (!hasColor) return false;
      }

      // In Stock filter
      if (inStockOnly && p.total_stock <= 0) return false;

      // On Sale filter
      if (onSaleOnly && (!p.sale_price || p.sale_price >= p.base_price)) return false;

      return true;
    }).sort((a, b) => {
      // If user searched, sort primarily by match relevance score
      if (searchQuery.trim() && sortBy === 'newest') {
        const scoreA = fuzzySearchData.matchedScores.get(a.id) || 0;
        const scoreB = fuzzySearchData.matchedScores.get(b.id) || 0;
        if (scoreA !== scoreB) return scoreB - scoreA;
      }

      const priceA = a.sale_price ?? a.base_price;
      const priceB = b.sale_price ?? b.base_price;
      if (sortBy === 'price-asc') return priceA - priceB;
      if (sortBy === 'price-desc') return priceB - priceA;
      if (sortBy === 'rating') return b.rating_avg - a.rating_avg;
      if (sortBy === 'popular') return b.review_count - a.review_count;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [
    products,
    categories,
    selectedCategory,
    selectedSubcategory,
    searchQuery,
    fuzzySearchData,
    maxPrice,
    selectedBrands,
    selectedColors,
    inStockOnly,
    onSaleOnly,
    sortBy,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedSubcategory('all');
    setSearchQuery('');
    setSelectedBrands([]);
    setSelectedColors([]);
    setInStockOnly(false);
    setOnSaleOnly(false);
    setMaxPrice(40000);
    setSortBy('newest');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    selectedCategory !== 'all' ||
    selectedSubcategory !== 'all' ||
    searchQuery.trim() !== '' ||
    selectedBrands.length > 0 ||
    selectedColors.length > 0 ||
    inStockOnly ||
    onSaleOnly ||
    maxPrice < 40000;

  return (
    <div className="py-8 text-neutral-900 dark:text-neutral-100">
      {/* Search and Filter Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-neutral-200 dark:border-[#1a1a1a]">
        {/* Search inside catalog */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search within collection (e.g. trench, boots, gold)..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-8 py-2.5 text-xs bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 border border-neutral-300 dark:border-[#222222] rounded-xl focus:border-brand-amber outline-none transition-colors"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Controls: Filter Drawer Toggle, Sort & Layout Switcher */}
        <div className="flex items-center gap-3 justify-between md:justify-end">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setMobileFilterOpen(true)}
            className="lg:hidden flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#1a1a1a] rounded-xl text-xs font-semibold text-neutral-800 dark:text-neutral-200"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filters</span>
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-brand-amber"></span>}
          </button>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-500 dark:text-neutral-400 hidden sm:inline-block font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white dark:bg-[#0a0a0a] border border-neutral-200 dark:border-[#1a1a1a] rounded-xl px-3 py-2 font-semibold text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-brand-amber cursor-pointer"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Most Popular</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center border border-neutral-200 dark:border-[#1a1a1a] rounded-xl overflow-hidden bg-white dark:bg-[#0a0a0a]">
            <button
              onClick={() => setViewMode('grid-4')}
              className={`p-2 transition-colors ${viewMode === 'grid-4' ? 'bg-brand-amber/15 text-brand-amber' : 'text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
              title="4-Column Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid-3')}
              className={`p-2 transition-colors ${viewMode === 'grid-3' ? 'bg-brand-amber/15 text-brand-amber' : 'text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'}`}
              title="3-Column Grid"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Typo Correction / Did You Mean Banner */}
      {searchQuery.trim() && fuzzySearchData.didYouMean && (
        <div className="mb-6 p-4 bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs animate-fade-in shadow-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-lg">💡</span>
            <div>
              <p className="text-stone-800 dark:text-stone-200">
                Showing results for <span className="font-semibold italic text-stone-900 dark:text-white">"{searchQuery}"</span>. Did you mean{' '}
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery(fuzzySearchData.didYouMean!);
                    saveRecentSearch(fuzzySearchData.didYouMean!);
                  }}
                  className="font-bold text-[#c46331] dark:text-amber-400 underline underline-offset-4 hover:opacity-80 cursor-pointer"
                >
                  "{fuzzySearchData.didYouMean}"
                </button>
                ?
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery(fuzzySearchData.didYouMean!);
              saveRecentSearch(fuzzySearchData.didYouMean!);
            }}
            className="px-3.5 py-1.5 bg-[#c46331] dark:bg-amber-500 hover:bg-[#b05527] text-white rounded-xl font-bold transition-all text-xs cursor-pointer shadow-xs"
          >
            Search "{fuzzySearchData.didYouMean}"
          </button>
        </div>
      )}

      {/* Active Filter Pills Bar */}
      {hasActiveFilters && (
        <div className="flex items-center flex-wrap gap-2 mb-6 p-3 bg-neutral-50 dark:bg-[#080808] rounded-xl border border-neutral-200/80 dark:border-[#1a1a1a] text-xs">
          <span className="font-semibold text-neutral-600 dark:text-neutral-400">Active Filters:</span>
          {selectedCategory !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-[#111111] border border-neutral-200 dark:border-[#222222] rounded-full font-medium text-neutral-800 dark:text-neutral-200">
              Category: {categories.find((c) => c.slug === selectedCategory)?.name}
              <button onClick={() => setSelectedCategory('all')}>
                <X className="w-3 h-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200" />
              </button>
            </span>
          )}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-[#111111] border border-neutral-200 dark:border-[#222222] rounded-full font-medium text-neutral-800 dark:text-neutral-200">
              "{searchQuery}"
              <button onClick={() => setSearchQuery('')}>
                <X className="w-3 h-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200" />
              </button>
            </span>
          )}
          {selectedBrands.map((b) => (
            <span key={b} className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-[#111111] border border-neutral-200 dark:border-[#222222] rounded-full font-medium text-neutral-800 dark:text-neutral-200">
              {b}
              <button onClick={() => setSelectedBrands(selectedBrands.filter((x) => x !== b))}>
                <X className="w-3 h-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200" />
              </button>
            </span>
          ))}
          {inStockOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-[#111111] border border-neutral-200 dark:border-[#222222] rounded-full font-medium text-neutral-800 dark:text-neutral-200">
              In Stock Only
              <button onClick={() => setInStockOnly(false)}>
                <X className="w-3 h-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200" />
              </button>
            </span>
          )}
          {onSaleOnly && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-white dark:bg-[#111111] border border-neutral-200 dark:border-[#222222] rounded-full font-medium text-neutral-800 dark:text-neutral-200">
              On Sale
              <button onClick={() => setOnSaleOnly(false)}>
                <X className="w-3 h-3 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200" />
              </button>
            </span>
          )}
          <button
            onClick={resetFilters}
            className="ml-auto text-xs font-bold text-brand-amber hover:underline flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" /> Clear All
          </button>
        </div>
      )}

      {/* Main Catalog Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Desktop Sidebar Filters */}
        <aside className="hidden lg:block lg:col-span-1 space-y-6">
          {/* Categories Filter */}
          <div className="bg-white dark:bg-[#0a0a0a] p-5 rounded-2xl border border-neutral-200/80 dark:border-[#1a1a1a] shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
              Categories
            </h3>
            <div className="space-y-1.5 text-xs">
              <button
                onClick={() => {
                  setSelectedCategory('all');
                  setSelectedSubcategory('all');
                }}
                className={`w-full text-left py-1.5 px-2 rounded-xl flex items-center justify-between transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-brand-amber/10 text-brand-amber font-bold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#151515]'
                }`}
              >
                <span>All Categories</span>
                <span className="text-neutral-400 text-[11px]">{products.length}</span>
              </button>
              {categories.map((cat) => (
                <div key={cat.id}>
                  <button
                    onClick={() => {
                      setSelectedCategory(cat.slug);
                      setSelectedSubcategory('all');
                    }}
                    className={`w-full text-left py-1.5 px-2 rounded-xl flex items-center justify-between transition-colors ${
                      selectedCategory === cat.slug
                        ? 'bg-brand-amber/10 text-brand-amber font-bold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-[#151515]'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-neutral-400 text-[11px]">
                      {products.filter((p) => p.category_id === cat.id).length}
                    </span>
                  </button>

                  {/* Subcategories if category selected */}
                  {selectedCategory === cat.slug && cat.subcategories && cat.subcategories.length > 0 && (
                    <div className="pl-4 py-1 space-y-1 border-l-2 border-neutral-100 dark:border-[#1a1a1a] ml-2">
                      {cat.subcategories.map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => setSelectedSubcategory(sub.slug)}
                          className={`w-full text-left py-1 text-[11px] ${
                            selectedSubcategory === sub.slug ? 'text-brand-amber font-bold' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
                          }`}
                        >
                          • {sub.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Price Range Slider Filter */}
          <div className="bg-white dark:bg-[#0a0a0a] p-5 rounded-2xl border border-neutral-200/80 dark:border-[#1a1a1a] shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">
                Price Cap
              </h3>
              <span className="text-xs font-bold text-brand-amber">Up to {formatAmount(maxPrice)}</span>
            </div>
            <input
              type="range"
              min="1000"
              max="40000"
              step="1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-brand-amber cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-neutral-400">
              <span>{formatAmount(1000)}</span>
              <span>{formatAmount(40000)}</span>
            </div>
          </div>

          {/* Availability & Sale Toggles */}
          <div className="bg-white dark:bg-[#0a0a0a] p-5 rounded-2xl border border-neutral-200/80 dark:border-[#1a1a1a] shadow-sm space-y-3 text-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-900 dark:text-neutral-100">Availability</h3>
            <label className="flex items-center gap-2.5 cursor-pointer text-neutral-700 dark:text-neutral-300 font-medium">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="w-4 h-4 rounded text-brand-amber focus:ring-brand-amber accent-brand-amber"
              />
              <span>In Stock Only</span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer text-neutral-700 dark:text-neutral-300 font-medium">
              <input
                type="checkbox"
                checked={onSaleOnly}
                onChange={(e) => setOnSaleOnly(e.target.checked)}
                className="w-4 h-4 rounded text-brand-amber focus:ring-brand-amber accent-brand-amber"
              />
              <span>On Sale (% Off)</span>
            </label>
          </div>
        </aside>

        {/* Product Grid Area */}
        <main className="lg:col-span-3">
          {filteredProducts.length > 0 ? (
            <>
              <div
                className={`grid gap-6 ${
                  viewMode === 'grid-3'
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }`}
              >
                {paginatedProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-12 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] hover:bg-neutral-50 dark:hover:bg-[#151515] disabled:opacity-40"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`w-8 h-8 text-xs font-semibold rounded-xl ${
                        currentPage === p
                          ? 'bg-brand-amber text-white'
                          : 'border border-neutral-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-[#151515]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-neutral-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] hover:bg-neutral-50 dark:hover:bg-[#151515] disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="p-12 text-center bg-white dark:bg-[#0a0a0a] rounded-3xl border border-neutral-200 dark:border-[#1a1a1a] shadow-sm space-y-4">
              <div className="w-16 h-16 bg-neutral-100 dark:bg-[#111111] rounded-full flex items-center justify-center mx-auto text-neutral-400">
                <Search className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">No pieces match your filters</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-sm mx-auto">
                Try widening your price range or clearing specific size and brand filters.
              </p>
              <button
                onClick={resetFilters}
                className="px-6 py-2.5 bg-brand-amber hover:bg-brand-amber-dark text-white rounded-full text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filters Modal */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setMobileFilterOpen(false)} />
          <div className="relative ml-auto w-full max-w-xs bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 h-full p-6 overflow-y-auto shadow-2xl flex flex-col justify-between border-l border-neutral-200 dark:border-[#1a1a1a]">
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-100 dark:border-[#1a1a1a]">
                <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">Filters</h3>
                <button onClick={() => setMobileFilterOpen(false)}>
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Categories */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-neutral-900 dark:text-neutral-100 uppercase">Categories</h4>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`block w-full text-left py-1 ${selectedCategory === 'all' ? 'text-brand-amber font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`block w-full text-left py-1 ${selectedCategory === cat.slug ? 'text-brand-amber font-bold' : 'text-neutral-600 dark:text-neutral-400'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-neutral-900 dark:text-neutral-100 uppercase">Price Cap: {formatAmount(maxPrice)}</h4>
                <input
                  type="range"
                  min="1000"
                  max="40000"
                  step="1000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-full accent-brand-amber"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2 text-xs">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => setInStockOnly(e.target.checked)}
                    className="accent-brand-amber"
                  />
                  <span>In Stock Only</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={onSaleOnly}
                    onChange={(e) => setOnSaleOnly(e.target.checked)}
                    className="accent-brand-amber"
                  />
                  <span>On Sale</span>
                </label>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800 mt-6">
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full py-3 bg-brand-amber hover:bg-brand-amber-dark text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
              >
                Apply Filters ({filteredProducts.length} Pieces)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
