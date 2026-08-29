'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Star, ShoppingBag, Heart, Check, ArrowRight } from 'lucide-react';
import { Product, ProductVariant } from '@/types';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { useCart } from '@/lib/context/CartContext';
import { useWishlist } from '@/lib/context/WishlistContext';

interface ProductQuickViewModalProps {
  product: Product;
  onClose: () => void;
}

export function ProductQuickViewModal({ product, onClose }: ProductQuickViewModalProps) {
  const router = useRouter();
  const { formatAmount } = useCurrency();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants?.[0]?.id || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [addedToast, setAddedToast] = useState(false);

  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId) || product.variants?.[0];
  const unitPrice = (product.sale_price ?? product.base_price) + (selectedVariant?.additional_price || 0);
  const isOutOfStock = (selectedVariant?.stock_quantity ?? product.total_stock) <= 0;
  const isWishlisted = isInWishlist(product.id);

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const res = addToCart(product, selectedVariant?.id, quantity);
    if (res.success) {
      setAddedToast(true);
      setTimeout(() => setAddedToast(false), 2000);
    }
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedVariant?.id, quantity);
    onClose();
    router.push('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in duration-300">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0a0a0a] text-neutral-900 dark:text-neutral-100 rounded-3xl shadow-2xl overflow-hidden animate-slide-up duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] border border-neutral-200 dark:border-[#1a1a1a]">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 bg-neutral-100 dark:bg-[#111111] hover:bg-neutral-200 dark:hover:bg-[#1a1a1a] rounded-full z-10 transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer shadow-sm border border-transparent dark:border-[#222222]"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 max-h-[85vh] overflow-y-auto">
          {/* Gallery Col */}
          <div className="p-6 bg-neutral-50 dark:bg-[#050505] flex flex-col justify-between">
            <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-neutral-200 dark:bg-[#000000] mb-4 border border-neutral-200 dark:border-[#1a1a1a]">
              <img
                src={product.images?.[selectedImageIndex]?.image_url || product.images?.[0]?.image_url}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails */}
            {(product.images?.length || 0) > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images?.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                      selectedImageIndex === idx ? 'border-brand-amber ring-2 ring-brand-amber/20' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Col */}
          <div className="p-6 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
                <span className="font-semibold uppercase tracking-wider">{product.brand}</span>
                <div className="flex items-center gap-1 text-amber-500 font-medium">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{product.rating_avg.toFixed(1)}</span>
                  <span className="text-neutral-400">({product.review_count} reviews)</span>
                </div>
              </div>

              <h2 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 leading-snug">{product.title}</h2>

              {/* Price */}
              <div className="mt-2 flex items-baseline gap-3">
                <span className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{formatAmount(unitPrice)}</span>
                {product.sale_price && (
                  <span className="text-xs text-neutral-400 line-through">
                    {formatAmount(product.base_price)}
                  </span>
                )}
                {product.discount_percent ? (
                  <span className="px-2 py-0.5 bg-brand-amber/15 text-brand-amber text-xs font-bold rounded-md">
                    {product.discount_percent}% OFF
                  </span>
                ) : null}
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-3 line-clamp-3 leading-relaxed">
                {product.short_description || product.description}
              </p>

              {/* Variant Selectors */}
              {product.variants && product.variants.length > 0 && (
                <div className="mt-4 space-y-2.5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider block">
                    Select Variant:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {product.variants.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => setSelectedVariantId(v.id)}
                        className={`px-3 py-1.5 text-xs rounded-xl border font-medium transition-all ${
                          selectedVariantId === v.id
                            ? 'border-brand-amber bg-brand-amber/10 text-brand-amber font-semibold'
                            : 'border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:border-neutral-300'
                        }`}
                      >
                        {v.size && <span>{v.size} </span>}
                        {v.color && <span>({v.color})</span>}
                        {v.stock_quantity <= 0 && <span className="text-neutral-400 ml-1">(Sold out)</span>}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="mt-4 flex items-center gap-4">
                <label className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 uppercase tracking-wider">Quantity:</label>
                <div className="flex items-center border border-neutral-200 dark:border-neutral-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 text-xs font-semibold text-neutral-800 dark:text-neutral-200">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-1 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 font-bold"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`btn-luxury-shimmer flex-1 py-3 px-4 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition-all duration-300 active:scale-[0.98] cursor-pointer ${
                    isOutOfStock
                      ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed'
                      : addedToast
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : 'bg-neutral-900 dark:bg-stone-900 hover:bg-[#c46331] dark:hover:bg-[#c46331] text-white shadow-md hover:shadow-[#c46331]/30'
                  }`}
                >
                  {addedToast ? (
                    <>
                      <Check className="w-4 h-4 animate-scale-in" /> Added to Bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" /> Add to Bag
                    </>
                  )}
                </button>

                <button
                  onClick={handleBuyNow}
                  disabled={isOutOfStock}
                  className="btn-luxury-shimmer py-3 px-5 bg-[#c46331] hover:bg-[#df7b47] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-[#c46331]/30 transition-all duration-300 disabled:opacity-50 cursor-pointer"
                >
                  Buy Now
                </button>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className="text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-rose-500 flex items-center gap-1.5 transition-colors"
                >
                  <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'text-rose-500 fill-current' : ''}`} />
                  {isWishlisted ? 'In Wishlist' : 'Add to Wishlist'}
                </button>

                <Link
                  href={`/product/${product.slug}`}
                  onClick={onClose}
                  className="text-xs font-semibold text-brand-amber hover:underline flex items-center gap-1"
                >
                  Full Piece Page <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
