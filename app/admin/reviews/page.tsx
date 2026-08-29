'use client';

import React, { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store/data-store';
import { useStore } from '@/lib/context/StoreContext';
import { cn, formatDate } from '@/lib/utils';
import { Review, Product } from '@/types';
import { Star, Check, X, Trash2, ChevronDown } from 'lucide-react';

export default function ReviewsManagementPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedReviewIds, setSelectedReviewIds] = useState<Set<string>>(new Set());
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);

  const { refreshData } = useStore();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    const allReviews = DataStore.getReviews();
    allReviews.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    setReviews(allReviews);

    const prods = DataStore.getProducts();
    const prodMap: Record<string, Product> = {};
    prods.forEach(p => prodMap[p.id] = p);
    setProducts(prodMap);
    
    setLoading(false);
  };

  const handleUpdateStatus = (id: string, status: 'approved' | 'rejected') => {
    DataStore.updateReviewStatus(id, status);
    refreshData();
    loadData();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      DataStore.deleteReview(id);
      refreshData();
      loadData();
    }
  };

  const handleBulkAction = (action: 'approved' | 'rejected') => {
    if (selectedReviewIds.size === 0) return;
    selectedReviewIds.forEach(id => {
      DataStore.updateReviewStatus(id, action);
    });
    setSelectedReviewIds(new Set());
    refreshData();
    loadData();
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedReviewIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedReviewIds(newSet);
  };

  const selectAll = (filtered: Review[]) => {
    if (selectedReviewIds.size === filtered.length) {
      setSelectedReviewIds(new Set());
    } else {
      setSelectedReviewIds(new Set(filtered.map(r => r.id)));
    }
  };

  const filteredReviews = reviews.filter(r => filter === 'all' || r.status === filter);

  const tabs = [
    { label: 'All Reviews', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ] as const;

  const renderStars = (rating: number) => {
    return (
      <div className="flex text-amber-400">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className={cn("h-3.5 w-3.5", star <= rating ? "fill-current" : "text-neutral-300 dark:text-neutral-700")} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Reviews & Moderation</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Review, verify, and moderate patron testimonials.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#14151a] rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-neutral-200 dark:border-neutral-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className={cn(
                  'px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors',
                  filter === tab.value
                    ? 'bg-brand-amber/15 text-brand-amber'
                    : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          
          {selectedReviewIds.size > 0 && (
            <div className="flex space-x-2 animate-in fade-in">
              <span className="px-3 py-1.5 text-xs text-neutral-500 dark:text-neutral-400">{selectedReviewIds.size} selected</span>
              <button
                onClick={() => handleBulkAction('approved')}
                className="px-3 py-1.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg hover:bg-emerald-200 transition-colors flex items-center"
              >
                <Check className="w-3.5 h-3.5 mr-1" /> Approve All
              </button>
              <button
                onClick={() => handleBulkAction('rejected')}
                className="px-3 py-1.5 text-xs font-semibold bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 rounded-lg hover:bg-red-200 transition-colors flex items-center"
              >
                <X className="w-3.5 h-3.5 mr-1" /> Reject All
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="p-8 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
            ))}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 dark:text-neutral-400 text-sm">
            No reviews found matching the current filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-neutral-50 dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3">
                    <input 
                      type="checkbox" 
                      className="rounded text-brand-amber focus:ring-brand-amber accent-brand-amber"
                      checked={selectedReviewIds.size > 0 && selectedReviewIds.size === filteredReviews.length}
                      onChange={() => selectAll(filteredReviews)}
                    />
                  </th>
                  <th className="px-5 py-3 font-medium text-neutral-900 dark:text-neutral-100">Product</th>
                  <th className="px-5 py-3 font-medium text-neutral-900 dark:text-neutral-100">Customer</th>
                  <th className="px-5 py-3 font-medium text-neutral-900 dark:text-neutral-100">Rating</th>
                  <th className="px-5 py-3 font-medium text-neutral-900 dark:text-neutral-100">Status</th>
                  <th className="px-5 py-3 font-medium text-neutral-900 dark:text-neutral-100">Date</th>
                  <th className="px-5 py-3 font-medium text-neutral-900 dark:text-neutral-100 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {filteredReviews.map((review) => {
                  const prod = products[review.product_id];
                  const prodImage = prod?.images?.[0]?.image_url || '/placeholder.jpg';

                  return (
                    <React.Fragment key={review.id}>
                      <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors group">
                        <td className="px-4 py-3.5">
                          <input 
                            type="checkbox" 
                            className="rounded text-brand-amber focus:ring-brand-amber accent-brand-amber"
                            checked={selectedReviewIds.has(review.id)}
                            onChange={() => toggleSelection(review.id)}
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center space-x-3 w-52 truncate">
                            {prod ? (
                              <>
                                <img src={prodImage} alt="" className="w-8 h-8 rounded object-cover border border-neutral-200 dark:border-neutral-700" />
                                <span className="font-medium text-neutral-900 dark:text-neutral-100 truncate" title={prod.title}>
                                  {prod.title}
                                </span>
                              </>
                            ) : (
                              <span className="text-neutral-400 italic">Piece archived</span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="font-medium text-neutral-900 dark:text-neutral-100">{review.user_name}</div>
                          {review.is_verified_purchase && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Verified Patron</span>}
                        </td>
                        <td className="px-5 py-3.5">
                          {renderStars(review.rating)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span className={cn(
                            "px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize",
                            review.status === 'approved' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" :
                            review.status === 'rejected' ? "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300" :
                            "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
                          )}>
                            {review.status}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-neutral-500 dark:text-neutral-400">{formatDate(review.created_at)}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => setExpandedReviewId(expandedReviewId === review.id ? null : review.id)}
                              className="p-1.5 text-neutral-400 hover:text-brand-amber transition-colors"
                              title="Toggle Details"
                            >
                              <ChevronDown className={cn("w-4 h-4 transition-transform", expandedReviewId === review.id && "rotate-180")} />
                            </button>
                            {review.status !== 'approved' && (
                              <button
                                onClick={() => handleUpdateStatus(review.id, 'approved')}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded transition-colors"
                                title="Approve"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {review.status !== 'rejected' && (
                              <button
                                onClick={() => handleUpdateStatus(review.id, 'rejected')}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded transition-colors"
                                title="Reject"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(review.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedReviewId === review.id && (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 bg-neutral-50/50 dark:bg-neutral-900/40 border-b border-neutral-100 dark:border-neutral-800 whitespace-normal">
                            <div className="pl-10">
                              <h4 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1 text-sm">{review.title}</h4>
                              <p className="text-neutral-600 dark:text-neutral-400 text-xs max-w-3xl leading-relaxed">{review.comment}</p>
                              {review.images && review.images.length > 0 && (
                                <div className="flex space-x-2 mt-3">
                                  {review.images.map((img, idx) => (
                                    <img key={idx} src={img} alt="" className="w-16 h-16 object-cover rounded-lg border border-neutral-200 dark:border-neutral-700" />
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
