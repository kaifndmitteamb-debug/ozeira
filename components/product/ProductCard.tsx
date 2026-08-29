'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, Scale, Eye, ShoppingBag, Star, Check } from 'lucide-react';
import { Product } from '@/types';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { useCart } from '@/lib/context/CartContext';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useCompare } from '@/lib/context/CompareContext';
import { ProductQuickViewModal } from './ProductQuickViewModal';

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className = '' }: ProductCardProps) {
  const { formatAmount } = useCurrency();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, addToCompare } = useCompare();

  const [isHovered, setIsHovered] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const [addedToast, setAddedToast] = useState(false);

  const primaryImage = product.images?.[0]?.image_url || 'https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=600';
  const secondaryImage = product.images?.[1]?.image_url || primaryImage;

  const isWishlisted = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);
  const isOutOfStock = product.total_stock <= 0;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    const res = addToCart(product);
    if (res.success) {
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 2000);
    }
  };

  return (
    <>
      <div
        className={`group relative flex flex-col bg-white dark:bg-[#0a0a0a] rounded-2xl border border-neutral-200/80 dark:border-[#1a1a1a] overflow-hidden shadow-xs hover:shadow-luxury-lg dark:hover:shadow-zblack-elevated hover:border-[#c46331]/50 dark:hover:border-[#c46331]/60 transition-all duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] transform hover:-translate-y-1.5 smooth-gpu ${className}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container with Badges */}
        <div className="relative aspect-[3/4] w-full bg-neutral-100 dark:bg-[#000000] overflow-hidden">
          <Link href={`/product/${product.slug}`} className="block w-full h-full">
            <img
              src={isHovered && secondaryImage ? secondaryImage : primaryImage}
              alt={product.title}
              className="w-full h-full object-cover object-center transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-106"
              loading="lazy"
            />
          </Link>

          {/* Badges (Sale / New / Out of Stock) */}
          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 z-10">
            {isOutOfStock ? (
              <span className="px-2.5 py-1 bg-black/90 dark:bg-black/95 border border-transparent dark:border-[#222222] backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-xs">
                Out of Stock
              </span>
            ) : (
              <>
                {product.sale_price && product.discount_percent ? (
                  <span className="px-2.5 py-1 bg-[#c46331] text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-xs animate-pulse-subtle">
                    {product.discount_percent}% OFF
                  </span>
                ) : null}
                {product.is_new && (
                  <span className="px-2.5 py-1 bg-black/90 dark:bg-[#111111]/95 border border-transparent dark:border-[#262626] backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded-md shadow-xs">
                    New Arrival
                  </span>
                )}
              </>
            )}
          </div>

          {/* Action Buttons Floating Overlay */}
          <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
            {/* Wishlist Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product.id);
              }}
              aria-label="Wishlist"
              className={`p-2 rounded-full backdrop-blur-md shadow-sm border border-transparent dark:border-[#222222] transition-all duration-300 hover:scale-115 active:scale-90 cursor-pointer ${
                isWishlisted
                  ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-500 hover:bg-rose-100 shadow-rose-500/20'
                  : 'bg-white/90 dark:bg-[#111111]/90 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-black hover:text-rose-500'
              }`}
              title={isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            >
              <Heart className={`w-3.5 h-3.5 transition-transform duration-200 ${isWishlisted ? 'fill-current scale-110' : ''}`} />
            </button>

            {/* Compare Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCompare(product.id);
              }}
              aria-label="Compare"
              className={`p-2 rounded-full backdrop-blur-md shadow-sm border border-transparent dark:border-[#222222] transition-all duration-300 hover:scale-115 active:scale-90 cursor-pointer ${
                isCompared
                  ? 'bg-neutral-900 text-white dark:bg-[#c46331]'
                  : 'bg-white/90 dark:bg-[#111111]/90 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-black hover:text-[#c46331]'
              }`}
              title={isCompared ? 'In Compare List' : 'Add to Compare'}
            >
              <Scale className="w-3.5 h-3.5" />
            </button>

            {/* Quick View Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setQuickViewOpen(true);
              }}
              aria-label="Quick View"
              className="p-2 bg-white/90 dark:bg-[#111111]/90 hover:bg-white dark:hover:bg-black text-neutral-700 dark:text-neutral-300 hover:text-[#c46331] rounded-full backdrop-blur-md shadow-sm border border-transparent dark:border-[#222222] transition-all duration-300 hover:scale-115 active:scale-90 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 cursor-pointer"
              title="Quick View"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick Add To Bag Bar (Slide up on hover) */}
          <div className="absolute inset-x-3 bottom-3 z-10 transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-0 group-hover:opacity-100 transform translate-y-3 group-hover:translate-y-0">
            {isOutOfStock ? (
              <Link
                href={`/product/${product.slug}`}
                className="w-full py-2.5 px-3 bg-black/95 dark:bg-black/95 border border-transparent dark:border-[#222222] backdrop-blur-md text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 shadow-lg hover:bg-neutral-800 transition-colors"
              >
                Notify When In Stock
              </Link>
            ) : (
              <button
                onClick={handleQuickAdd}
                className={`btn-luxury-shimmer w-full py-2.5 px-3 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-xl transition-all duration-300 active:scale-[0.97] cursor-pointer ${
                  addedToast
                    ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                    : 'bg-neutral-900/95 dark:bg-black/95 border border-transparent dark:border-[#262626] hover:bg-[#c46331] dark:hover:bg-[#c46331] text-white backdrop-blur-md hover:shadow-[#c46331]/30'
                }`}
              >
                {addedToast ? (
                  <>
                    <Check className="w-3.5 h-3.5 animate-scale-in" /> Added to Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3.5 h-3.5 transition-transform duration-200 group-hover:scale-110" /> Quick Add
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Product Meta Info */}
        <div className="p-3.5 flex flex-col flex-1">
          <div className="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mb-1">
            <span className="uppercase tracking-wider font-semibold">{product.brand || 'Ozeira'}</span>
            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest">
              {product.category_name || 'Atelier'}
            </span>
          </div>

          <Link href={`/product/${product.slug}`} className="block group-hover:text-brand-amber transition-colors">
            <h3 className="text-xs sm:text-sm font-semibold text-neutral-900 dark:text-neutral-100 line-clamp-2 min-h-[2.5rem] leading-snug">
              {product.title}
            </h3>
          </Link>

          {/* Color swatches preview if available */}
          {product.variants && product.variants.length > 1 && (
            <div className="flex items-center gap-1 my-2">
              {Array.from(new Set(product.variants.map((v) => v.color_hex).filter(Boolean))).slice(0, 4).map((hex, idx) => (
                <span
                  key={idx}
                  style={{ backgroundColor: hex || '#ccc' }}
                  className="w-2.5 h-2.5 rounded-full border border-neutral-300 dark:border-neutral-700 ring-1 ring-white dark:ring-black"
                />
              ))}
              {product.variants.length > 4 && (
                <span className="text-[10px] text-neutral-400">+{product.variants.length - 4}</span>
              )}
            </div>
          )}

          {/* Price Row */}
          <div className="mt-auto pt-2 flex items-baseline gap-2 border-t border-neutral-100 dark:border-[#1a1a1a]">
            <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
              {formatAmount(product.sale_price ?? product.base_price)}
            </span>
            {product.sale_price && (
              <span className="text-xs text-neutral-400 line-through">
                {formatAmount(product.base_price)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      {quickViewOpen && (
        <ProductQuickViewModal product={product} onClose={() => setQuickViewOpen(false)} />
      )}
    </>
  );
}
