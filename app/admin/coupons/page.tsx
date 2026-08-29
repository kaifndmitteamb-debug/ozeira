'use client';

import { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store/data-store';
import { Coupon, OfferCampaign } from '@/types';
import { useStore } from '@/lib/context/StoreContext';
import { cn, formatDate } from '@/lib/utils';
import { Plus, Edit, Trash2, X, Tag, Percent } from 'lucide-react';

export default function CouponsOffersPage() {
  const { refreshData } = useStore();
  const [activeTab, setActiveTab] = useState<'coupons' | 'offers'>('coupons');
  
  // Data state
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [offers, setOffers] = useState<OfferCampaign[]>([]);
  
  // Modals state
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [editingOffer, setEditingOffer] = useState<OfferCampaign | null>(null);

  // Form state
  const [couponForm, setCouponForm] = useState<Partial<Coupon>>({});
  const [offerForm, setOfferForm] = useState<Partial<OfferCampaign>>({});

  const loadData = () => {
    setCoupons(DataStore.getCoupons());
    setOffers(DataStore.getOffers());
  };

  useEffect(() => {
    loadData();
  }, []);

  // Coupon Handlers
  const openCouponModal = (coupon?: Coupon) => {
    if (coupon) {
      setEditingCoupon(coupon);
      setCouponForm(coupon);
    } else {
      setEditingCoupon(null);
      setCouponForm({
        code: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        min_order_amount: 0,
        usage_count: 0,
        is_active: true,
      });
    }
    setIsCouponModalOpen(true);
  };

  const saveCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const toSave: Coupon = {
      id: editingCoupon?.id || `coup-${Date.now()}`,
      code: couponForm.code?.toUpperCase() || '',
      description: couponForm.description || '',
      discount_type: couponForm.discount_type as 'percentage' | 'flat',
      discount_value: Number(couponForm.discount_value) || 0,
      min_order_amount: Number(couponForm.min_order_amount) || 0,
      max_discount_amount: couponForm.max_discount_amount ? Number(couponForm.max_discount_amount) : undefined,
      usage_limit: couponForm.usage_limit ? Number(couponForm.usage_limit) : undefined,
      usage_count: couponForm.usage_count || 0,
      expires_at: couponForm.expires_at || undefined,
      is_active: couponForm.is_active ?? true,
    };
    DataStore.saveCoupon(toSave);
    refreshData();
    loadData();
    setIsCouponModalOpen(false);
  };

  const deleteCoupon = (id: string) => {
    if (window.confirm('Delete this coupon?')) {
      DataStore.deleteCoupon(id);
      refreshData();
      loadData();
    }
  };

  // Offer Handlers
  const openOfferModal = (offer?: OfferCampaign) => {
    if (offer) {
      setEditingOffer(offer);
      setOfferForm(offer);
    } else {
      setEditingOffer(null);
      setOfferForm({
        name: '',
        description: '',
        discount_type: 'percentage',
        discount_value: 0,
        applies_to: 'all',
        target_ids: [],
        start_date: new Date().toISOString().slice(0,16),
        end_date: new Date(Date.now() + 86400000 * 30).toISOString().slice(0,16),
        is_active: true,
      });
    }
    setIsOfferModalOpen(true);
  };

  const saveOffer = (e: React.FormEvent) => {
    e.preventDefault();
    const toSave: OfferCampaign = {
      id: editingOffer?.id || `offer-${Date.now()}`,
      name: offerForm.name || '',
      description: offerForm.description || '',
      discount_type: offerForm.discount_type as 'percentage' | 'flat',
      discount_value: Number(offerForm.discount_value) || 0,
      applies_to: offerForm.applies_to as 'all' | 'category' | 'products',
      target_ids: typeof offerForm.target_ids === 'string' 
        ? (offerForm.target_ids as string).split(',').map(s => s.trim()).filter(Boolean)
        : (offerForm.target_ids || []),
      start_date: offerForm.start_date || new Date().toISOString(),
      end_date: offerForm.end_date || new Date().toISOString(),
      is_active: offerForm.is_active ?? true,
    };
    DataStore.saveOffer(toSave);
    refreshData();
    loadData();
    setIsOfferModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Promotions & Vouchers</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage discount coupon codes and automated campaigns.</p>
        </div>
        <button
          onClick={() => activeTab === 'coupons' ? openCouponModal() : openOfferModal()}
          className="flex items-center space-x-2 bg-brand-amber hover:bg-brand-amber-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add {activeTab === 'coupons' ? 'Coupon' : 'Campaign'}</span>
        </button>
      </div>

      <div className="flex border-b border-neutral-200 dark:border-neutral-800">
        <button
          onClick={() => setActiveTab('coupons')}
          className={cn(
            "px-6 py-3 font-medium text-sm transition-colors relative",
            activeTab === 'coupons' 
              ? "text-brand-amber font-semibold" 
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          )}
        >
          Coupons
          {activeTab === 'coupons' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-amber" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('offers')}
          className={cn(
            "px-6 py-3 font-medium text-sm transition-colors relative",
            activeTab === 'offers' 
              ? "text-brand-amber font-semibold" 
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
          )}
        >
          Automatic Offers
          {activeTab === 'offers' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-amber" />
          )}
        </button>
      </div>

      {/* COUPONS TAB */}
      {activeTab === 'coupons' && (
        <div className="bg-white dark:bg-[#14151a] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-x-auto shadow-sm">
          <table className="w-full text-xs text-left">
            <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 font-medium border-b border-neutral-200 dark:border-neutral-800 uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min Order</th>
                <th className="px-4 py-3">Usage</th>
                <th className="px-4 py-3">Expires</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {coupons.map((coupon) => (
                <tr key={coupon.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                  <td className="px-4 py-3.5 font-mono font-bold text-brand-amber">
                    {coupon.code}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-900 dark:text-neutral-100">
                    {coupon.discount_type === 'percentage' 
                      ? `${coupon.discount_value}%` 
                      : `₹${coupon.discount_value}`}
                    {coupon.max_discount_amount ? ` (Max ₹${coupon.max_discount_amount})` : ''}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-700 dark:text-neutral-300">₹{coupon.min_order_amount}</td>
                  <td className="px-4 py-3.5 text-neutral-500 dark:text-neutral-400">
                    {coupon.usage_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : 'uses'}
                  </td>
                  <td className="px-4 py-3.5 text-neutral-500 dark:text-neutral-400">
                    {coupon.expires_at ? formatDate(coupon.expires_at) : 'Never'}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider",
                      coupon.is_active ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300" : "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
                    )}>
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => openCouponModal(coupon)} className="p-1 text-neutral-400 hover:text-brand-amber">
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => deleteCoupon(coupon.id)} className="p-1 text-neutral-400 hover:text-red-500">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {coupons.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-neutral-500 dark:text-neutral-400">
                    No coupons found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* OFFERS TAB */}
      {activeTab === 'offers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer) => (
            <div key={offer.id} className="bg-white dark:bg-[#14151a] border border-neutral-200 dark:border-neutral-800 rounded-xl p-5 relative overflow-hidden shadow-sm">
              {!offer.is_active && (
                <div className="absolute top-0 right-0 bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 text-[10px] uppercase font-bold px-2 py-1">
                  Inactive
                </div>
              )}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-brand-amber/10 text-brand-amber flex items-center justify-center rounded-xl">
                    {offer.discount_type === 'percentage' ? <Percent className="w-5 h-5" /> : <Tag className="w-5 h-5" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{offer.name}</h3>
                    <p className="text-xs text-brand-amber font-medium">
                      {offer.discount_type === 'percentage' ? `${offer.discount_value}%` : `₹${offer.discount_value}`} OFF
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-6 text-xs">
                <p className="text-neutral-600 dark:text-neutral-400 line-clamp-2">{offer.description}</p>
                <div className="text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900 p-2.5 rounded-lg border border-neutral-100 dark:border-neutral-800">
                  <span className="font-semibold block text-neutral-800 dark:text-neutral-200 mb-0.5">Applies to: {offer.applies_to.toUpperCase()}</span>
                  {offer.target_ids.length > 0 ? offer.target_ids.join(', ') : 'All Items'}
                </div>
                <div className="text-neutral-500 dark:text-neutral-400 flex justify-between pt-1">
                  <span>Starts: {formatDate(offer.start_date)}</span>
                  <span>Ends: {formatDate(offer.end_date)}</span>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button onClick={() => openOfferModal(offer)} className="flex-1 text-center py-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 rounded-lg hover:border-brand-amber hover:text-brand-amber transition-colors">
                  Edit Offer
                </button>
              </div>
            </div>
          ))}
          {offers.length === 0 && (
            <div className="col-span-full py-12 text-center text-neutral-500 dark:text-neutral-400 bg-neutral-50 dark:bg-neutral-900/50 rounded-xl border border-neutral-200 dark:border-neutral-800 border-dashed text-sm">
              No automatic offers configured.
            </div>
          )}
        </div>
      )}

      {/* COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#14151a] text-neutral-900 dark:text-neutral-100 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-[#14151a] z-10">
              <h2 className="text-lg font-semibold text-brand-amber">
                {editingCoupon ? 'Edit Coupon' : 'Add New Coupon'}
              </h2>
              <button onClick={() => setIsCouponModalOpen(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={saveCoupon} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={couponForm.code}
                  onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})}
                  className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 uppercase font-mono outline-none focus:border-brand-amber"
                  placeholder="e.g. SUMMER20"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Description *</label>
                <input
                  type="text"
                  required
                  value={couponForm.description}
                  onChange={e => setCouponForm({...couponForm, description: e.target.value})}
                  className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Discount Type</label>
                  <select
                    value={couponForm.discount_type}
                    onChange={e => setCouponForm({...couponForm, discount_type: e.target.value as 'percentage' | 'flat'})}
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={couponForm.discount_value ?? ''}
                    onChange={e => setCouponForm({...couponForm, discount_value: parseFloat(e.target.value) || 0})}
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={couponForm.min_order_amount ?? ''}
                    onChange={e => setCouponForm({...couponForm, min_order_amount: parseFloat(e.target.value) || 0})}
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Max Discount (₹, Optional)</label>
                  <input
                    type="number"
                    min="0"
                    value={couponForm.max_discount_amount || ''}
                    onChange={e => setCouponForm({...couponForm, max_discount_amount: e.target.value ? parseFloat(e.target.value) : undefined})}
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber"
                    disabled={couponForm.discount_type === 'flat'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Usage Limit (Optional)</label>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.usage_limit || ''}
                    onChange={e => setCouponForm({...couponForm, usage_limit: e.target.value ? parseInt(e.target.value) : undefined})}
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber"
                    placeholder="Total allowed uses"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Expires At (Optional)</label>
                  <input
                    type="datetime-local"
                    value={couponForm.expires_at ? new Date(couponForm.expires_at).toISOString().slice(0,16) : ''}
                    onChange={e => setCouponForm({...couponForm, expires_at: e.target.value ? new Date(e.target.value).toISOString() : undefined})}
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={couponForm.is_active}
                    onChange={(e) => setCouponForm({ ...couponForm, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  <span className="ms-3 font-medium text-neutral-700 dark:text-neutral-300">Active</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-3 sticky bottom-0 bg-white dark:bg-[#14151a] border-t border-neutral-100 dark:border-neutral-800 mt-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-amber hover:bg-brand-amber-dark text-white font-medium rounded-lg transition-colors"
                >
                  Save Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OFFER MODAL */}
      {isOfferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#14151a] text-neutral-900 dark:text-neutral-100 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-[#14151a] z-10">
              <h2 className="text-lg font-semibold text-brand-amber">
                {editingOffer ? 'Edit Offer' : 'Add New Offer'}
              </h2>
              <button onClick={() => setIsOfferModalOpen(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={saveOffer} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Offer Name *</label>
                <input
                  type="text"
                  required
                  value={offerForm.name}
                  onChange={e => setOfferForm({...offerForm, name: e.target.value})}
                  className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber"
                  placeholder="e.g. Summer Sale 2026"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Description *</label>
                <textarea
                  required
                  rows={2}
                  value={offerForm.description}
                  onChange={e => setOfferForm({...offerForm, description: e.target.value})}
                  className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Discount Type</label>
                  <select
                    value={offerForm.discount_type}
                    onChange={e => setOfferForm({...offerForm, discount_type: e.target.value as 'percentage' | 'flat'})}
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="flat">Flat Amount (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Discount Value *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={offerForm.discount_value ?? ''}
                    onChange={e => setOfferForm({...offerForm, discount_value: parseFloat(e.target.value) || 0})}
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Applies To</label>
                <select
                  value={offerForm.applies_to}
                  onChange={e => setOfferForm({...offerForm, applies_to: e.target.value as any})}
                  className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber mb-2"
                >
                  <option value="all">All Products</option>
                  <option value="category">Specific Categories</option>
                  <option value="products">Specific Products</option>
                </select>
                
                {offerForm.applies_to !== 'all' && (
                  <input
                    type="text"
                    value={Array.isArray(offerForm.target_ids) ? offerForm.target_ids.join(', ') : ''}
                    onChange={e => setOfferForm({...offerForm, target_ids: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                    placeholder="Enter IDs separated by comma"
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-brand-amber"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Start Date *</label>
                  <input
                    type="datetime-local"
                    required
                    value={offerForm.start_date ? new Date(offerForm.start_date).toISOString().slice(0,16) : ''}
                    onChange={e => setOfferForm({...offerForm, start_date: new Date(e.target.value).toISOString()})}
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber text-xs"
                  />
                </div>
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">End Date *</label>
                  <input
                    type="datetime-local"
                    required
                    value={offerForm.end_date ? new Date(offerForm.end_date).toISOString().slice(0,16) : ''}
                    onChange={e => setOfferForm({...offerForm, end_date: new Date(e.target.value).toISOString()})}
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber text-xs"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={offerForm.is_active}
                    onChange={(e) => setOfferForm({ ...offerForm, is_active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  <span className="ms-3 font-medium text-neutral-700 dark:text-neutral-300">Active</span>
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-3 sticky bottom-0 bg-white dark:bg-[#14151a] border-t border-neutral-100 dark:border-neutral-800 mt-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsOfferModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-amber hover:bg-brand-amber-dark text-white font-medium rounded-lg transition-colors"
                >
                  Save Offer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
