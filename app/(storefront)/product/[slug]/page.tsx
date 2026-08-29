'use client';

import React, { useState, use } from 'react';
import Link from 'next/link';
import { notFound, useRouter, useParams } from 'next/navigation';
import {
  Star,
  ShoppingBag,
  Heart,
  Scale,
  Bell,
  Share2,
  Check,
  Truck,
  RefreshCw,
  ShieldCheck,
  Ruler,
  ChevronRight,
  MessageCircle,
  Copy,
} from 'lucide-react';
import { useStore } from '@/lib/context/StoreContext';
import { DataStore } from '@/lib/store/data-store';
import { INITIAL_PRODUCTS } from '@/lib/data/initial-data';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { useCart } from '@/lib/context/CartContext';
import { useWishlist } from '@/lib/context/WishlistContext';
import { useCompare } from '@/lib/context/CompareContext';
import { ProductCard } from '@/components/product/ProductCard';
import { NotifyRestockModal } from '@/components/product/NotifyRestockModal';
import { WriteReviewModal } from '@/components/product/WriteReviewModal';
import { SizeChartModal } from '@/components/product/SizeChartModal';
import { ProductJsonLd } from '@/components/common/ProductJsonLd';
import { formatDate } from '@/lib/utils';

export default function ProductDetailPage() {
  const router = useRouter();
  const routeParams = useParams();
  const rawSlug = routeParams?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug[0] : (rawSlug as string) || '';

  const { getProductBySlug, products, categories, getReviewsForProduct } = useStore();
  const { formatAmount } = useCurrency();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, addToCompare } = useCompare();

  const product =
    (slug ? getProductBySlug(slug) : undefined) ||
    (slug ? DataStore.getProductBySlug(slug) : undefined) ||
    (slug ? DataStore.getProducts().find((p) => p.slug === slug || p.id === slug) : undefined) ||
    (slug ? INITIAL_PRODUCTS.find((p) => p.slug === slug || p.id === slug) : undefined);

  if (!product) {
    return notFound();
  }

  const reviews = getReviewsForProduct(product.id);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants[0]?.id || ''
  );
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'shipping' | 'reviews'>('description');
  const [notifyModalOpen, setNotifyModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [sizeChartModalOpen, setSizeChartModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [addedToast, setAddedToast] = useState(false);
  const [zoomStyle, setZoomStyle] = useState<{ display: string; backgroundPosition: string }>({
    display: 'none',
    backgroundPosition: '0% 0%',
  });

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) || product.variants[0];
  const isWishlisted = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);
  const isOutOfStock = (selectedVariant ? selectedVariant.stock_quantity <= 0 : product.total_stock <= 0);

  const unitPrice = selectedVariant
    ? (product.sale_price || product.base_price) + (selectedVariant.additional_price || 0)
    : (product.sale_price || product.base_price);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomStyle({
      display: 'block',
      backgroundPosition: `${x}% ${y}%`,
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      display: 'none',
      backgroundPosition: '0% 0%',
    });
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedVariant?.id, quantity);
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 2500);
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    addToCart(product, selectedVariant?.id, quantity);
    router.push('/checkout');
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const currentImage = product.images[selectedImageIndex]?.image_url || product.images[0]?.image_url;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 transition-colors">
      <ProductJsonLd product={product} url={`http://localhost:3000/product/${product.slug}`} />
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400 mb-8 font-medium">
        <Link href="/" className="hover:text-stone-900 dark:hover:text-stone-200">
          Home
        </Link>
        <span>/</span>
        <Link href="/shop" className="hover:text-stone-900 dark:hover:text-stone-200">
          Shop
        </Link>
        <span>/</span>
        <Link href={`/shop?category=${product.category_id}`} className="hover:text-stone-900 dark:hover:text-stone-200">
          {product.category_name || 'Collection'}
        </Link>
        <span>/</span>
        <span className="text-stone-900 dark:text-stone-100 truncate max-w-[200px]">{product.title}</span>
      </nav>

      {/* Main Product Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 pb-16 border-b border-stone-200 dark:border-[#1a1a1a]">
        {/* Left: Gallery & Zoom (Col 7) */}
        <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4">
          {/* Thumbnails Sidebar */}
          {product.images.length > 1 && (
            <div className="flex sm:flex-col gap-3 overflow-x-auto sm:overflow-y-auto sm:max-h-[560px] pb-2 sm:pb-0 flex-shrink-0">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-16 h-20 sm:w-20 sm:h-24 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 bg-stone-100 dark:bg-[#000000] ${
                    selectedImageIndex === idx
                      ? 'border-[#c46331] ring-2 ring-[#c46331]/20 opacity-100'
                      : 'border-stone-200 dark:border-[#1a1a1a] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.image_url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Main Hero Image with Zoom Lens */}
          <div
            className="relative flex-1 aspect-[3/4] rounded-2xl overflow-hidden bg-stone-100 dark:bg-[#000000] cursor-crosshair group shadow-sm border border-stone-200 dark:border-[#1a1a1a]"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <img
              src={currentImage}
              alt={product.title}
              className="w-full h-full object-cover object-center transition-transform duration-300"
            />

            {/* Magnifier Zoom Lens Window on Hover */}
            <div
              className="absolute inset-0 pointer-events-none hidden lg:block bg-no-repeat transition-opacity"
              style={{
                display: zoomStyle.display,
                backgroundImage: `url(${currentImage})`,
                backgroundSize: '220%',
                backgroundPosition: zoomStyle.backgroundPosition,
              }}
            />

            {/* Badges */}
            <div className="absolute top-4 left-4 flex flex-col gap-1.5 z-10 pointer-events-none">
              {product.sale_price && product.discount_percent ? (
                <span className="px-3 py-1 bg-[#c46331] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                  {product.discount_percent}% OFF
                </span>
              ) : null}
              {product.is_new && (
                <span className="px-3 py-1 bg-black dark:bg-[#111111] border border-white/10 dark:border-[#222222] text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm">
                  Atelier New
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Product Details & Variant Selectors (Col 5) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Brand & SKU */}
            <div className="flex items-center justify-between text-xs text-stone-500 dark:text-stone-400">
              <span className="font-bold uppercase tracking-widest text-[#c46331]">{product.brand}</span>
              <span>SKU: {selectedVariant?.sku || product.sku}</span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
              {product.title}
            </h1>

            {/* Ratings Summary */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-amber-500">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.rating_avg) ? 'fill-current' : 'text-stone-300 dark:text-stone-700'
                    }`}
                  />
                ))}
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 ml-1.5">
                  {product.rating_avg.toFixed(1)}
                </span>
              </div>
              <span className="text-xs text-stone-400">•</span>
              <button
                onClick={() => setActiveTab('reviews')}
                className="text-xs font-semibold text-stone-600 dark:text-stone-400 hover:text-[#c46331] underline cursor-pointer"
              >
                {reviews.length} Verified Reviews
              </button>
            </div>

            {/* Pricing */}
            <div className="flex items-baseline gap-3 pt-2 border-t border-stone-100 dark:border-[#1a1a1a]">
              <span className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100">
                {formatAmount(unitPrice)}
              </span>
              {product.sale_price && (
                <span className="text-base text-stone-400 line-through">
                  {formatAmount(product.base_price)}
                </span>
              )}
              <span className="text-[11px] text-stone-500 dark:text-stone-400 font-medium">
                (Inclusive of all taxes & duties)
              </span>
            </div>

            {/* Short Description */}
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
              {product.short_description || product.description}
            </p>

            {/* Variant Selector: Colors and Sizes */}
            {product.variants && product.variants.length > 0 && (
              <div className="space-y-4 pt-3 border-t border-stone-100 dark:border-[#1a1a1a]">
                {/* Color choices if present */}
                {product.variants.some((v) => v.color) && (
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider mb-2">
                      <span>Color: <span className="font-normal text-stone-600 dark:text-stone-400">{selectedVariant?.color}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                      {Array.from(
                        new Map(product.variants.map((v) => [v.color, v])).values()
                      ).map((v) => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                            selectedVariant?.color === v.color
                              ? 'border-[#c46331] bg-[#fdf8f4] dark:bg-amber-950/40 text-[#c46331]'
                              : 'border-stone-200 dark:border-[#1a1a1a] text-stone-700 dark:text-stone-300 hover:border-stone-300 dark:hover:border-stone-600'
                          }`}
                        >
                          {v.color_hex && (
                            <span
                              style={{ backgroundColor: v.color_hex }}
                              className="w-3 h-3 rounded-full border border-stone-300 shadow-xs"
                            />
                          )}
                          <span>{v.color}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Size choices if present */}
                {product.variants.some((v) => v.size) && (
                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider mb-2">
                      <span>Size: <span className="font-normal text-stone-600 dark:text-stone-400">{selectedVariant?.size}</span></span>
                      <button
                        onClick={() => setSizeChartModalOpen(true)}
                        className="text-xs font-bold text-[#c46331] hover:underline flex items-center gap-1 normal-case cursor-pointer"
                      >
                        <Ruler className="w-3.5 h-3.5" /> Size & Fit Guide
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((v) => {
                        const isSelected = selectedVariantId === v.id;
                        const isSoldOut = v.stock_quantity <= 0;
                        return (
                          <button
                            key={v.id}
                            onClick={() => setSelectedVariantId(v.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'border-[#c46331] bg-[#c46331] text-white shadow-sm'
                                : isSoldOut
                                ? 'border-stone-200 dark:border-[#1a1a1a] bg-stone-100 dark:bg-[#0a0a0a] text-stone-400 cursor-not-allowed line-through'
                                : 'border-stone-200 dark:border-[#1a1a1a] bg-white dark:bg-[#0a0a0a] text-stone-800 dark:text-stone-200 hover:border-stone-400 dark:hover:border-stone-600'
                            }`}
                          >
                            {v.size}
                            {v.additional_price > 0 && ` (+${formatAmount(v.additional_price)})`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Stock status & Quantity Stepper */}
            <div className="flex items-center gap-6 pt-3">
              <div>
                <label className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider block mb-1">
                  Quantity
                </label>
                <div className="flex items-center border border-stone-300 dark:border-[#1a1a1a] rounded-xl overflow-hidden bg-white dark:bg-[#0a0a0a]">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={isOutOfStock}
                    className="px-3.5 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-[#151515] font-bold disabled:opacity-40 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="px-4 py-2 text-xs font-bold text-stone-900 dark:text-stone-100">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    disabled={isOutOfStock}
                    className="px-3.5 py-2 text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-[#151515] font-bold disabled:opacity-40 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-stone-800 dark:text-stone-200 uppercase tracking-wider block mb-1">
                  Availability
                </span>
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs font-bold rounded-lg">
                    Temporarily Out of Stock
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    In Stock ({selectedVariant?.stock_quantity ?? product.total_stock} pieces left)
                  </span>
                )}
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3 pt-4 border-t border-stone-100 dark:border-[#1a1a1a]">
              {isOutOfStock ? (
                <button
                  onClick={() => setNotifyModalOpen(true)}
                  className="w-full py-4 bg-black dark:bg-[#111111] border border-white/10 dark:border-[#222222] hover:bg-stone-900 text-white text-xs font-bold uppercase tracking-widest rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                >
                  <Bell className="w-4 h-4 text-[#f5d480]" />
                  <span>Notify Me When In Stock</span>
                </button>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={handleAddToCart}
                    className={`btn-luxury-shimmer py-4 px-6 text-xs font-bold uppercase tracking-widest rounded-2xl shadow-md flex items-center justify-center gap-2 transition-all duration-300 transform hover:-translate-y-0.5 active:scale-[0.98] cursor-pointer ${
                      addedToast
                        ? 'bg-emerald-600 text-white'
                        : 'bg-black dark:bg-[#111111] border border-white/10 dark:border-[#222222] dark:text-stone-100 hover:bg-[#c46331] dark:hover:bg-[#c46331] hover:text-white text-white'
                    }`}
                  >
                    {addedToast ? (
                      <>
                        <Check className="w-4 h-4" /> Added to Bag
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" /> Add to Bag
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleBuyNow}
                    className="btn-luxury-shimmer py-4 px-6 bg-[#c46331] hover:bg-[#a34c28] active:scale-[0.98] text-white text-xs font-bold uppercase tracking-widest rounded-2xl shadow-md transition-all duration-300 transform hover:-translate-y-0.5 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Instant Buy Now</span>
                  </button>
                </div>
              )}

              {/* Wishlist, Compare & Share Row */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isWishlisted
                      ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300'
                      : 'border-stone-200 dark:border-[#1a1a1a] text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#151515]'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
                  <span>{isWishlisted ? 'Wishlisted' : 'Wishlist'}</span>
                </button>

                <button
                  onClick={() => addToCompare(product.id)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    isCompared
                      ? 'border-black bg-black text-white'
                      : 'border-stone-200 dark:border-[#1a1a1a] text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#151515]'
                  }`}
                >
                  <Scale className="w-3.5 h-3.5" />
                  <span>{isCompared ? 'Comparing' : 'Compare'}</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  className="py-2.5 px-3 rounded-xl border border-stone-200 dark:border-[#1a1a1a] text-stone-700 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-[#151515] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied!' : 'Share'}</span>
                </button>
              </div>
            </div>

            {/* Value Guarantees mini cards */}
            <div className="p-4 bg-[#fdfbf9] dark:bg-[#0a0a0a] rounded-2xl border border-stone-200/80 dark:border-[#1a1a1a] space-y-2 text-xs text-stone-600 dark:text-stone-300">
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-[#c46331]" />
                <span>Complimentary Express Shipping on orders above ₹1,999</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RefreshCw className="w-4 h-4 text-[#c46331]" />
                <span>7-Day Compliment Home Pickup & Exchange Policy</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#c46331]" />
                <span>Certified Genuine Masterpiece with Authenticity Certificate</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Content Tabs: Description, Specs, Shipping, Reviews */}
      <section className="py-12 border-b border-stone-200 dark:border-[#1a1a1a]">
        <div className="flex items-center space-x-6 border-b border-stone-200 dark:border-[#1a1a1a] mb-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex-shrink-0 cursor-pointer ${
              activeTab === 'description'
                ? 'border-[#c46331] text-[#c46331]'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Atelier Description
          </button>
          <button
            onClick={() => setActiveTab('specifications')}
            className={`pb-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex-shrink-0 cursor-pointer ${
              activeTab === 'specifications'
                ? 'border-[#c46331] text-[#c46331]'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Technical Specifications
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`pb-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex-shrink-0 cursor-pointer ${
              activeTab === 'shipping'
                ? 'border-[#c46331] text-[#c46331]'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            Delivery & Returns
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-4 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors border-b-2 flex-shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-[#c46331] text-[#c46331]'
                : 'border-transparent text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-200'
            }`}
          >
            <span>Reviews ({reviews.length})</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="max-w-4xl">
          {activeTab === 'description' && (
            <div className="space-y-4 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              <p>{product.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                <div className="p-4 bg-stone-50 dark:bg-[#0a0a0a] rounded-xl border border-stone-200/80 dark:border-[#1a1a1a]">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-1">Ethical Provenance</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Sourced exclusively from certified mills adhering to zero toxic runoff and fair living wages.
                  </p>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-[#0a0a0a] rounded-xl border border-stone-200/80 dark:border-[#1a1a1a]">
                  <h4 className="font-bold text-stone-900 dark:text-stone-100 mb-1">Hand-Finished Inspection</h4>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Every piece undergoes a 12-point quality review by our master tailors before dispatch.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'specifications' && (
            <div className="border border-stone-200 dark:border-[#1a1a1a] rounded-xl overflow-hidden bg-white dark:bg-[#0a0a0a]">
              <table className="w-full text-xs text-left divide-y divide-stone-200 dark:divide-[#1a1a1a]">
                <tbody className="divide-y divide-stone-100 dark:divide-[#1a1a1a]">
                  {Object.entries(product.specifications || {}).map(([key, val]) => (
                    <tr key={key}>
                      <td className="p-3.5 bg-stone-50 dark:bg-[#050505] font-bold text-stone-800 dark:text-stone-200 w-1/3">{key}</td>
                      <td className="p-3.5 text-stone-700 dark:text-stone-300">{val}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className="p-3.5 bg-stone-50 dark:bg-[#050505] font-bold text-stone-800 dark:text-stone-200">Weight</td>
                    <td className="p-3.5 text-stone-700 dark:text-stone-300">{product.weight_grams} grams</td>
                  </tr>
                  {product.dimensions && (
                    <tr>
                      <td className="p-3.5 bg-stone-50 dark:bg-[#050505] font-bold text-stone-800 dark:text-stone-200">Dimensions</td>
                      <td className="p-3.5 text-stone-700 dark:text-stone-300">{product.dimensions}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'shipping' && (
            <div className="space-y-4 text-xs sm:text-sm text-stone-700 dark:text-stone-300 leading-relaxed">
              <p>
                All Ozeira orders are packed in custom luxury rigid gift boxes with moisture-sealed archival tissue paper and silk ribbons.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs">
                <li><strong>Standard Insured Delivery:</strong> 3-5 business days across India.</li>
                <li><strong>Priority Air Express:</strong> 1-2 business days with real-time SMS status updates.</li>
                <li><strong>Cash on Delivery (COD):</strong> Supported for eligible pincodes with a nominal fee.</li>
                <li><strong>7-Day Returns:</strong> Doorstep collection with 100% full refund to original payment source.</li>
              </ul>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-8">
              {/* Rating Summary Breakdown */}
              <div className="p-6 bg-stone-50 dark:bg-[#0a0a0a] rounded-2xl border border-stone-200 dark:border-[#1a1a1a] flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="text-center sm:text-left">
                  <div className="text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">
                    {product.rating_avg.toFixed(1)}
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 my-1 justify-center sm:justify-start">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.floor(product.rating_avg) ? 'fill-current' : 'text-stone-300 dark:text-stone-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-stone-500 dark:text-stone-400">Based on {reviews.length} authenticated patrons</p>
                </div>

                <button
                  onClick={() => setReviewModalOpen(true)}
                  className="px-6 py-3 bg-black dark:bg-[#111111] border border-white/10 dark:border-[#222222] hover:bg-[#c46331] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  Write a Review
                </button>
              </div>

              {/* Review Item List */}
              {reviews.length === 0 ? (
                <div className="text-center py-10 text-stone-400">
                  <p className="text-xs">Be the first to review this atelier masterpiece.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-5 bg-white dark:bg-[#0a0a0a] rounded-2xl border border-stone-200/80 dark:border-[#1a1a1a] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex items-center text-amber-500">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-current' : 'text-stone-300 dark:text-stone-700'}`}
                              />
                            ))}
                          </div>
                          <span className="text-xs font-bold text-stone-900 dark:text-stone-100">{rev.title}</span>
                        </div>
                        <span className="text-[11px] text-stone-400">{formatDate(rev.created_at)}</span>
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">{rev.comment}</p>

                      <div className="flex items-center justify-between pt-2 border-t border-stone-100 dark:border-[#1a1a1a] text-[11px] text-stone-500 dark:text-stone-400">
                        <span>By <strong className="text-stone-800 dark:text-stone-200">{rev.user_name}</strong></span>
                        {rev.is_verified_purchase && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <Check className="w-3 h-3" /> Verified Patron
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Recommended / Related Products */}
      <section className="py-16">
        <h3 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100 mb-8">
          You May Also Admire
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products
            .filter((p) => p.id !== product.id && p.category_id === product.category_id)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
        </div>
      </section>

      {/* Modals */}
      {notifyModalOpen && (
        <NotifyRestockModal
          product={product}
          variantId={selectedVariant?.id}
          onClose={() => setNotifyModalOpen(false)}
        />
      )}

      {reviewModalOpen && (
        <WriteReviewModal
          product={product}
          onClose={() => setReviewModalOpen(false)}
        />
      )}

      {sizeChartModalOpen && (
        <SizeChartModal
          categoryName={product.category_name}
          onClose={() => setSizeChartModalOpen(false)}
        />
      )}
    </div>
  );
}
