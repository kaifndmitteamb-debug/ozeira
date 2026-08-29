'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { DataStore } from '@/lib/store/data-store';
import { Search, ChevronDown, ChevronUp, HelpCircle, MessageSquare } from 'lucide-react';
import type { CMSPage } from '@/types';

const FAQ_CATEGORIES = [
  {
    title: 'Ordering & Customization',
    questions: [
      { q: 'Can I modify or cancel my order after placement?', a: 'We process orders swiftly to ensure rapid delivery. Once an order is confirmed, modifications or cancellations can be accommodated within the first 60 minutes. Please contact our live concierge via WhatsApp or email immediately.' },
      { q: 'Do I need an account to place an order?', a: 'No, you may checkout as a guest. However, creating an Atelier account unlocks order tracking, a 250-point welcome bonus, and automatic tier upgrades in our Loyalty Program.' },
      { q: 'How do I determine my precise size?', a: 'Each product features an interactive Size & Fit guide with garment and body measurements in both inches and centimeters. You can also chat with our concierge for real-time sizing advice.' }
    ]
  },
  {
    title: 'Shipping, Delivery & Tracking',
    questions: [
      { q: 'Where does Ozeira ship?', a: 'We offer pan-India express insured delivery to all tier 1, 2, and 3 cities covering over 19,000 postal PIN codes, with international shipping available upon request.' },
      { q: 'How long does insured express delivery take?', a: 'Standard orders arrive within 3 to 5 business days. Express air courier takes 1 to 2 business days. Real-time SMS and email tracking links are dispatched the moment your package is sealed.' },
      { q: 'Is Cash on Delivery (COD) available?', a: 'Yes, Cash on Delivery is available across most serviceable pin codes for orders within the store COD threshold.' }
    ]
  },
  {
    title: 'Returns, Replacements & Refunds',
    questions: [
      { q: 'What is your return & exchange window?', a: 'Ozeira offers a 7-day hassle-free replacement window for unworn items in their original condition with all security tags and luxury boxes intact.' },
      { q: 'How do I request a replacement or size exchange?', a: 'Simply visit our Track Order or Account Orders portal, enter your order number, and click "Request Return/Exchange" to book a doorstep pickup.' },
      { q: 'When will my refund be credited?', a: 'Refunds are inspected and processed within 3 business days of return arrival, transferred back to your original payment card, UPI ID, or bank account.' }
    ]
  }
];

export default function FAQPage() {
  const [page, setPage] = useState<CMSPage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    '0-0': true,
    '1-0': true,
  });

  useEffect(() => {
    const data = DataStore.getCMSPageBySlug('faq');
    if (data) setPage(data);
  }, []);

  const toggleItem = (categoryId: number, qId: number) => {
    const key = `${categoryId}-${qId}`;
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredCategories = FAQ_CATEGORIES.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="bg-stone-50 dark:bg-[#0f1014] min-h-screen pb-20 transition-colors">
      <div className="bg-white dark:bg-[#16171b] py-16 px-4 text-center border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#c46331] mx-auto">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {page?.title || 'Frequently Asked Questions'}
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            Find immediate clarity on sizing, order tracking, returns, and bespoke craftsmanship.
          </p>
          
          <div className="max-w-md mx-auto relative pt-2">
            <input 
              type="text" 
              placeholder="Search by keyword (e.g., sizing, return, COD)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 pl-11 pr-4 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-full text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331] shadow-xs"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 w-4 h-4" />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {filteredCategories.length > 0 ? (
          filteredCategories.map((category, cIdx) => (
            <div key={cIdx} className="mb-10">
              <h2 className="text-lg font-serif font-bold mb-4 text-stone-900 dark:text-stone-100">
                {category.title}
              </h2>
              <div className="space-y-3">
                {category.questions.map((item, qIdx) => {
                  const isOpen = openItems[`${cIdx}-${qIdx}`];
                  return (
                    <div
                      key={qIdx}
                      className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden bg-white dark:bg-[#16171b] shadow-xs transition-colors"
                    >
                      <button 
                        onClick={() => toggleItem(cIdx, qIdx)}
                        className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-stone-50 dark:hover:bg-stone-850/60 transition-colors cursor-pointer"
                      >
                        <span className="font-semibold text-xs sm:text-sm text-stone-900 dark:text-stone-100">
                          {item.q}
                        </span>
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-[#c46331] flex-shrink-0 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-stone-400 flex-shrink-0 ml-2" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-stone-600 dark:text-stone-300 border-t border-stone-100 dark:border-stone-800/80 leading-relaxed bg-stone-50/50 dark:bg-stone-900/30">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-[#16171b] rounded-3xl border border-stone-200 dark:border-stone-800 p-8">
            <p className="text-stone-500 dark:text-stone-400 text-xs">
              No matching questions found for "{searchQuery}".
            </p>
          </div>
        )}

        <div className="mt-12 text-center bg-white dark:bg-[#16171b] p-8 sm:p-10 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#c46331] mx-auto">
            <MessageSquare className="w-5 h-5" />
          </div>
          <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
            Still Have Inquiries?
          </h3>
          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
            Our atelier concierge is available 7 days a week to provide customized styling advice.
          </p>
          <div className="pt-2">
            <Link
              href="/contact"
              className="inline-block bg-[#1a1714] hover:bg-[#c46331] text-white px-6 py-2.5 rounded-xl uppercase tracking-wider text-xs font-bold transition-colors shadow-sm"
            >
              Contact Atelier Concierge →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
