'use client';

import React, { useState } from 'react';
import { Order, OrderItem } from '@/types';
import { X, RotateCcw, CheckCircle2, AlertCircle, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DataStore } from '@/lib/store/data-store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface RequestReturnModalProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RequestReturnModal({ order, isOpen, onClose, onSuccess }: RequestReturnModalProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [returnType, setReturnType] = useState<'return' | 'exchange'>('return');
  const [reason, setReason] = useState('size_mismatch');
  const [exchangeSize, setExchangeSize] = useState('L');
  const [customerNotes, setCustomerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const reasons = [
    { id: 'size_mismatch', label: 'Size / Fit Mismatch (Too Large / Too Small)' },
    { id: 'style_preference', label: 'Different Style Preferred in Person' },
    { id: 'fabric_quality', label: 'Fabric / Texture Difference from Expectation' },
    { id: 'defect_damage', label: 'Manufacturing Defect or Transit Damage' },
    { id: 'wrong_item', label: 'Received Incorrect Variant or Color' },
  ];

  const handleToggleItem = (itemId: string) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      setErrorMsg('Please select at least one item to return or exchange.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      // 1. Update Order status to return_requested
      const returnNote = `[${returnType.toUpperCase()} REQUESTED] Reason: ${reasons.find(r => r.id === reason)?.label}. ${returnType === 'exchange' ? `Requested Exchange Size: ${exchangeSize}. ` : ''}${customerNotes ? `Customer Notes: "${customerNotes}"` : ''}`;
      
      await DataStore.updateOrderStatus(
        order.id,
        'return_requested',
        returnNote
      );

      // 2. Call /api/returns to notify staff & log in database
      await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_id: order.id,
          order_number: order.order_number,
          user_id: order.user_id,
          recipient_email: order.guest_email || '',
          items: order.items.filter(i => selectedItems.includes(i.id)),
          return_type: returnType,
          reason: reasons.find(r => r.id === reason)?.label || reason,
          exchange_size: returnType === 'exchange' ? exchangeSize : null,
          customer_notes: customerNotes,
        }),
      });

      setSubmitted(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit return request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#16171b] w-full max-w-lg rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-[#c46331]">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Bespoke Return & Size Exchange</h2>
              <p className="text-[11px] text-stone-500 dark:text-stone-400">Order #{order.order_number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-50 dark:bg-emerald-950/50 rounded-full flex items-center justify-center mx-auto text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-stone-900 dark:text-stone-100">Request Registered with Atelier Concierge</h3>
            <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto">
              Our concierge team will review your request within 24 hours. A complimentary courier pickup will be scheduled at your registered address.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
            
            {/* Return or Exchange Switcher */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Request Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReturnType('return')}
                  className={cn(
                    "py-2.5 px-4 rounded-xl border text-xs font-bold transition-all text-center",
                    returnType === 'return'
                      ? "border-[#c46331] bg-amber-50 dark:bg-amber-950/40 text-[#c46331]"
                      : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400"
                  )}
                >
                  Full Return (Refund)
                </button>
                <button
                  type="button"
                  onClick={() => setReturnType('exchange')}
                  className={cn(
                    "py-2.5 px-4 rounded-xl border text-xs font-bold transition-all text-center",
                    returnType === 'exchange'
                      ? "border-[#c46331] bg-amber-50 dark:bg-amber-950/40 text-[#c46331]"
                      : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400"
                  )}
                >
                  Size Exchange (Complimentary)
                </button>
              </div>
            </div>

            {/* Select Items */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Select Items to {returnType === 'return' ? 'Return' : 'Exchange'}
              </label>
              <div className="space-y-2">
                {(order.items || []).map((item) => {
                  const isSelected = selectedItems.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className={cn(
                        "p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all",
                        isSelected
                          ? "border-[#c46331] bg-amber-50/50 dark:bg-amber-950/30 ring-1 ring-[#c46331]"
                          : "border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 hover:border-stone-300"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-[#c46331]"
                      />
                      <img src={item.product_image} alt={item.product_title} className="w-12 h-12 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">{item.product_title}</p>
                        <p className="text-[11px] text-stone-500">Qty: {item.quantity} • ₹{item.unit_price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reason Selector */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Primary Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100 outline-none focus:border-[#c46331]"
              >
                {reasons.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>

            {/* Size Selector for Exchange */}
            {returnType === 'exchange' && (
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Preferred Replacement Size</label>
                <div className="flex gap-2">
                  {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setExchangeSize(sz)}
                      className={cn(
                        "w-10 h-10 rounded-xl border text-xs font-bold transition-all flex items-center justify-center",
                        exchangeSize === sz
                          ? "border-[#c46331] bg-[#c46331] text-white shadow-xs"
                          : "border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-stone-400"
                      )}
                    >
                      {sz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Notes */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Additional Notes for Atelier Concierge (Optional)</label>
              <textarea
                rows={2}
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                placeholder="Provide any details regarding the fit, packaging, or special instructions..."
                className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100 outline-none focus:border-[#c46331]"
              />
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#1a1714] dark:bg-amber-600 hover:bg-[#c46331] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting Request...
                  </>
                ) : (
                  <>
                    <span>Submit {returnType === 'return' ? 'Return' : 'Exchange'} Request</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
