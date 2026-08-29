'use client';

import React, { useState } from 'react';
import { X, Star, CheckCircle2 } from 'lucide-react';
import { Product } from '@/types';
import { useStore } from '@/lib/context/StoreContext';
import { useAuth } from '@/lib/context/AuthContext';

interface WriteReviewModalProps {
  product: Product;
  onClose: () => void;
}

export function WriteReviewModal({ product, onClose }: WriteReviewModalProps) {
  const { submitReview } = useStore();
  const { user } = useAuth();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [userName, setUserName] = useState(user?.full_name || '');
  const [imageUrl, setImageUrl] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const res = submitReview({
      productId: product.id,
      userId: user?.id,
      userName: userName.trim() || 'Verified Client',
      rating,
      title: title.trim(),
      comment: comment.trim(),
      images: imageUrl.trim() ? [imageUrl.trim()] : [],
    });

    setIsSuccess(true);
    setSuccessMsg(res.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-white dark:bg-[#14151a] text-neutral-900 dark:text-neutral-100 rounded-3xl shadow-2xl p-6 border border-neutral-200 dark:border-neutral-800 animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccess ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h3 className="font-bold text-xl text-neutral-900 dark:text-neutral-100">Review Published</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-sm mx-auto">{successMsg}</p>
            <button
              onClick={onClose}
              className="mt-4 px-6 py-2.5 bg-brand-amber hover:bg-brand-amber-dark text-white rounded-full text-xs font-semibold transition-colors"
            >
              Close Window
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">Write an Atelier Review</h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">Share your impressions on craftsmanship, fit, and materials.</p>
            </div>

            {/* Star Rating Selector */}
            <div>
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 block mb-1.5">Overall Rating *</label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 text-neutral-300 dark:text-neutral-700 hover:text-amber-400 focus:outline-none transition-colors"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        (hoverRating || rating) >= star ? 'fill-amber-400 text-amber-400' : ''
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-neutral-700 dark:text-neutral-300 ml-2">
                  {rating === 5 ? 'Exceptional (5/5)' : `${rating}/5 Stars`}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Your Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Eleanor Vance"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-brand-amber"
                />
              </div>

              <div>
                <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Review Headline</label>
                <input
                  type="text"
                  placeholder="e.g. Masterful stitchwork"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-brand-amber"
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Your Experience *</label>
              <textarea
                rows={4}
                required
                placeholder="Describe the texture, weight, longevity, or sizing precision..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-brand-amber"
              />
            </div>

            {/* Optional Photo URL */}
            <div className="text-xs">
              <label className="font-semibold text-neutral-700 dark:text-neutral-300 block mb-1">Photo URL (Optional)</label>
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-xl outline-none focus:border-brand-amber font-mono text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-brand-amber hover:bg-brand-amber-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md transition-colors"
            >
              Submit Review & Claim 100 Points
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
