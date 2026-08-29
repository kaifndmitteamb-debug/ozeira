'use client';

import React from 'react';
import Link from 'next/link';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { useCart } from '@/lib/context/CartContext';
import { Heart, ShoppingBag, Trash2, HeartCrack } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WishlistPage() {
  const { wishlistProducts, toggleWishlist } = useWishlist();
  const { formatAmount } = useCurrency();
  const { addToCart } = useCart();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-1">
          My Saved Wishlist
        </h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Handcrafted creations you have preserved for future curation.
        </p>
      </div>

      {wishlistProducts.length === 0 ? (
        <div className="bg-white dark:bg-[#16171b] rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 p-14 text-center flex flex-col items-center justify-center">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 rounded-full flex items-center justify-center mb-4 text-rose-500">
            <HeartCrack size={28} />
          </div>
          <h2 className="text-base font-bold text-stone-900 dark:text-stone-100 mb-1">Your wishlist is empty</h2>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-6 max-w-sm">
            Save items you adore to your wishlist. Review them anytime and easily transfer them into your bag.
          </p>
          <Link
            href="/shop"
            className="px-8 py-3 bg-[#1a1714] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-[#c46331] transition-colors shadow-sm"
          >
            Explore Boutique Pieces →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {wishlistProducts.map((product) => {
            const primaryImage = product.images?.find(img => img.is_primary)?.image_url || product.images?.[0]?.image_url;
            const price = product.sale_price ?? product.base_price;
            
            return (
              <div key={product.id} className="bg-white dark:bg-[#16171b] rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 overflow-hidden group">
                <div className="relative aspect-[3/4] bg-stone-100 dark:bg-stone-800 overflow-hidden">
                  <Link href={`/product/${product.slug}`}>
                    <img 
                      src={primaryImage} 
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </Link>
                  
                  <button 
                    onClick={() => toggleWishlist(product.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/90 dark:bg-stone-900/90 backdrop-blur-sm rounded-full flex items-center justify-center text-rose-500 hover:bg-white hover:text-rose-600 transition-colors shadow-sm cursor-pointer"
                    title="Remove from wishlist"
                  >
                    <Trash2 size={14} />
                  </button>

                  {product.sale_price && (
                    <span className="absolute bottom-3 left-3 bg-[#c46331] text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Sale
                    </span>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  <div>
                    <p className="text-[10px] text-stone-400 font-semibold uppercase tracking-wider">{product.brand}</p>
                    <Link href={`/product/${product.slug}`} className="block">
                      <h3 className="font-serif text-xs font-bold text-stone-900 dark:text-stone-100 hover:text-[#c46331] transition-colors truncate">
                        {product.title}
                      </h3>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-100 dark:border-stone-800">
                    <div>
                      <span className="font-bold text-xs text-stone-900 dark:text-stone-100">
                        {formatAmount(price)}
                      </span>
                      {product.sale_price && (
                        <span className="text-[10px] text-stone-400 line-through ml-2">
                          {formatAmount(product.base_price)}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => addToCart(product)}
                      disabled={product.total_stock <= 0}
                      className="p-2 bg-[#1a1714] dark:bg-stone-800 hover:bg-[#c46331] text-white rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-40"
                      title={product.total_stock > 0 ? "Add to Bag" : "Out of Stock"}
                    >
                      <ShoppingBag size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
