'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, ShieldCheck, Truck, RefreshCw, Clock, CheckCircle2, Instagram, Twitter, Youtube } from 'lucide-react';
import { useStore } from '@/lib/context/StoreContext';
import { useCurrency, useLanguage } from '@/lib/context/CurrencyLanguageContext';

export function Footer() {
  const { settings, subscribeNewsletter, categories } = useStore();
  const { currency } = useCurrency();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState<{ text: string; isSuccess: boolean } | null>(null);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setFeedbackMessage({ text: 'Please enter a valid email address.', isSuccess: false });
      return;
    }
    const res = subscribeNewsletter(email);
    setFeedbackMessage({ text: res.message, isSuccess: res.success });
    if (res.success) {
      setEmail('');
    }
  };

  return (
    <footer className="bg-black text-stone-300 pt-16 pb-12 border-t border-[#1a1a1a]">
      {/* Top Value Assurance Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-[#1a1a1a]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#080808] border border-[#141414]">
            <div className="p-3 bg-[#111111] border border-[#1a1a1a] rounded-xl text-[#e59a68] flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Complimentary Express</h4>
              <p className="text-xs text-stone-400 mt-1">Insured doorstep delivery on all orders above ₹1,999.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#080808] border border-[#141414]">
            <div className="p-3 bg-[#111111] border border-[#1a1a1a] rounded-xl text-[#e59a68] flex-shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">7-Day Easy Returns</h4>
              <p className="text-xs text-stone-400 mt-1">Effortless pickup with 100% money-back guarantee.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#080808] border border-[#141414]">
            <div className="p-3 bg-[#111111] border border-[#1a1a1a] rounded-xl text-[#e59a68] flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Generational Longevity</h4>
              <p className="text-xs text-stone-400 mt-1">Full-grain hides, 18K gold vermeil & Goodyear welting.</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-4 rounded-2xl bg-[#080808] border border-[#141414]">
            <div className="p-3 bg-[#111111] border border-[#1a1a1a] rounded-xl text-[#e59a68] flex-shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Atelier Concierge</h4>
              <p className="text-xs text-stone-400 mt-1">Direct styling advice and sizing help via WhatsApp.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-serif text-3xl font-bold tracking-widest text-white uppercase">
                {settings?.general?.storeName || 'Ozeira'}
              </span>
            </Link>
            <p className="text-xs text-stone-400 leading-relaxed max-w-sm">
              {settings?.general?.tagline || 'Modern Luxury, Conscious Craftsmanship'}. Meticulously crafted limited-edition apparel, leather travel goods, fine jewelry, and footwear.
            </p>
            <div className="text-xs text-stone-400 space-y-1">
              <p><strong className="text-stone-300">Concierge:</strong> {settings?.general?.supportEmail || 'care@ozeira.com'}</p>
              <p><strong className="text-stone-300">Helpline:</strong> {settings?.general?.supportPhone || '+91 98765 43210'}</p>
              <p><strong className="text-stone-300">Atelier:</strong> {settings?.general?.supportAddress || '42 Heritage Blvd, Bandra West, Mumbai'}</p>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3 pt-2">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#111111] border border-[#1a1a1a] hover:bg-[#c46331] text-stone-300 hover:text-white rounded-full transition-colors" aria-label="Instagram">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#111111] border border-[#1a1a1a] hover:bg-[#c46331] text-stone-300 hover:text-white rounded-full transition-colors" aria-label="Twitter / X">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-[#111111] border border-[#1a1a1a] hover:bg-[#c46331] text-stone-300 hover:text-white rounded-full transition-colors" aria-label="YouTube">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Collection Links */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white mb-4">{t('footer.collection', 'The Collection')}</h5>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <Link href="/shop" className="hover:text-white transition-colors">
                  {t('nav.shop_all', 'Shop All Pieces')}
                </Link>
              </li>
              {categories.slice(0, 5).map((cat) => (
                <li key={cat.id}>
                  <Link href={`/shop?category=${cat.slug}`} className="hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/shop?filter=featured" className="hover:text-white transition-colors">
                  {t('home.featured_pieces', 'Featured Highlights')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Client Concierge */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white mb-4">{t('footer.client_care', 'Client Care')}</h5>
            <ul className="space-y-2.5 text-xs text-stone-400">
              <li>
                <Link href="/track-order" className="hover:text-white transition-colors">
                  {t('nav.track_order', 'Track Your Order')}
                </Link>
              </li>
              <li>
                <Link href="/account/loyalty" className="hover:text-white transition-colors">
                  Loyalty Points Wallet
                </Link>
              </li>
              <li>
                <Link href="/account/referrals" className="hover:text-white transition-colors">
                  Refer a Friend (₹500 Reward)
                </Link>
              </li>
              <li>
                <Link href="/policy/shipping-returns" className="hover:text-white transition-colors">
                  Shipping & Returns Policy
                </Link>
              </li>
              <li>
                <Link href="/faq" className="hover:text-white transition-colors">
                  FAQ & Care Guides
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  Contact Atelier
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h5 className="text-xs font-bold uppercase tracking-widest text-white mb-4">{t('footer.private_gazette', 'Private Gazette')}</h5>
            <p className="text-xs text-stone-400 mb-3 leading-relaxed">
              {t('footer.gazette_subtitle', 'Subscribe to receive private collection releases and a ₹500 welcome voucher.')}
            </p>
            <form onSubmit={handleNewsletterSubmit} className="space-y-2">
              <div className="relative">
                <input
                  type="email"
                  placeholder={t('footer.subscribe_placeholder', 'Enter your email')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#0a0a0a] border border-[#222222] rounded-xl text-white placeholder-stone-500 focus:outline-none focus:border-[#c46331]"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-[#c46331] hover:bg-[#a34c28] text-white rounded-lg transition-colors cursor-pointer"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
              {feedbackMessage && (
                <p
                  className={`text-[11px] ${
                    feedbackMessage.isSuccess ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {feedbackMessage.text}
                </p>
              )}
            </form>
            <p className="text-[10px] text-stone-500 mt-2">
              By subscribing you agree to our{' '}
              <Link href="/policy/privacy" className="underline hover:text-stone-300">
                Privacy Policy
              </Link>.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Legal & Payment Icons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-[#1a1a1a] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-stone-500">
        <p>© {new Date().getFullYear()} {settings?.general?.storeName || 'Ozeira Atelier Ltd'}. {t('footer.rights', 'All rights reserved.')}</p>

        {/* Accepted Payment badges */}
        <div className="flex items-center gap-2 text-[10px] text-stone-400 font-medium">
          <span className="px-2.5 py-1 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">Razorpay</span>
          <span className="px-2.5 py-1 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">UPI / GPay</span>
          <span className="px-2.5 py-1 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">Visa / MC</span>
          <span className="px-2.5 py-1 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">NetBanking</span>
          <span className="px-2.5 py-1 bg-[#0a0a0a] rounded-lg border border-[#1a1a1a]">Cash on Delivery</span>
        </div>

        <div className="flex items-center space-x-4 text-[11px]">
          <Link href="/policy/privacy" className="hover:text-stone-300">
            Privacy Policy
          </Link>
          <span>•</span>
          <Link href="/policy/terms" className="hover:text-stone-300">
            Terms of Service
          </Link>
          <span>•</span>
          <Link href="/policy/shipping-returns" className="hover:text-stone-300">
            Returns
          </Link>
        </div>
      </div>
    </footer>
  );
}
