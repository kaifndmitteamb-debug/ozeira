'use client';

import React, { useState } from 'react';
import { X, Bell, CheckCircle2 } from 'lucide-react';
import { Product } from '@/types';
import { useStore } from '@/lib/context/StoreContext';

interface NotifyRestockModalProps {
  product: Product;
  variantId?: string;
  onClose: () => void;
}

export function NotifyRestockModal({ product, variantId, onClose }: NotifyRestockModalProps) {
  const { subscribeRestock } = useStore();
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setMessage('Please enter a valid email address.');
      return;
    }

    const res = subscribeRestock(product.id, email, phone, variantId);
    setIsSuccess(true);
    setMessage(res.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 border border-stone-200 animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-stone-400 hover:text-stone-900 rounded-full hover:bg-stone-100"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-6 space-y-3">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-lg text-stone-900">Restock Notification Active</h3>
            <p className="text-xs text-stone-600 leading-relaxed">{message}</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-stone-900 text-white rounded-full text-xs font-semibold hover:bg-stone-800"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#fdf8f4] text-[#c46331] rounded-xl">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">Notify Me When Available</h3>
                <p className="text-xs text-stone-500">We'll alert you immediately upon restock.</p>
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl flex items-center gap-3">
              <img
                src={product.images[0]?.image_url}
                alt={product.title}
                className="w-12 h-12 rounded-lg object-cover"
              />
              <div className="text-xs min-w-0">
                <p className="font-semibold text-stone-900 truncate">{product.title}</p>
                <p className="text-stone-500">{product.brand}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-stone-700 block mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:border-[#c46331] outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 block mb-1">Mobile Phone (Optional for SMS)</label>
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:border-[#c46331] outline-none"
                />
              </div>
            </div>

            {message && <p className="text-xs text-rose-600 font-medium">{message}</p>}

            <button
              type="submit"
              className="w-full py-3 bg-[#c46331] hover:bg-[#a34c28] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors"
            >
              Send Notification Request
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
