'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/context/StoreContext';
import { ProductCatalogGrid } from '@/components/product/ProductCatalogGrid';

function ShopContent() {
  const searchParams = useSearchParams();
  const { products, categories } = useStore();

  const categorySlug = searchParams.get('category');
  const subcategorySlug = searchParams.get('subcategory');
  const searchQuery = searchParams.get('q');

  const currentCategory = categories.find((c) => c.slug === categorySlug);
  const currentSubcategory = currentCategory?.subcategories?.find((s) => s.slug === subcategorySlug);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-6 font-medium">
        <Link href="/" className="hover:text-stone-900 dark:hover:text-stone-100">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-stone-900 dark:hover:text-stone-100">
          Shop
        </Link>
        {currentCategory && (
          <>
            <span>/</span>
            <Link href={`/shop?category=${currentCategory.slug}`} className="hover:text-stone-900 dark:hover:text-stone-100">
              {currentCategory.name}
            </Link>
          </>
        )}
        {currentSubcategory && (
          <>
            <span>/</span>
            <span className="text-[#c46331]">{currentSubcategory.name}</span>
          </>
        )}
      </nav>

      {/* Clean Page Title Header */}
      <div className="mb-8">
        <h1 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 dark:text-stone-100 tracking-tight">
          {searchQuery
            ? `Results for "${searchQuery}"`
            : currentSubcategory
            ? currentSubcategory.name
            : currentCategory
            ? currentCategory.name
            : 'All Atelier Pieces'}
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 mt-1.5 max-w-xl">
          {currentCategory?.description || 'Browse our complete catalog of masterfully crafted luxury creations.'}
        </p>
      </div>

      {/* Interactive Catalog Grid */}
      <ProductCatalogGrid
        products={products}
        categories={categories}
        initialCategory={categorySlug || undefined}
        initialQuery={searchQuery || undefined}
      />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto p-12 text-center text-xs text-stone-500">Loading collection...</div>}>
      <ShopContent />
    </Suspense>
  );
}
