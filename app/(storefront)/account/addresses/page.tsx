'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Address } from '@/types';
import { MapPin, Plus, Edit2, Trash2, CheckCircle2, Home, Briefcase, Map, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ADDRESS_STORAGE_KEY = 'ozeira_addresses_v1';

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<Address>>({
    address_type: 'home',
    is_default: false,
  });

  useEffect(() => {
    if (user) {
      const stored = localStorage.getItem(ADDRESS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Address[];
        setAddresses(parsed.filter(a => a.user_id === user.id));
      } else {
        const sample: Address = {
          id: 'addr-' + Date.now(),
          user_id: user.id,
          full_name: user.full_name,
          phone: user.phone || '9876543210',
          street: '123 Heritage Luxury Blvd',
          apartment: 'Suite 4B',
          city: 'Mumbai',
          state: 'Maharashtra',
          postal_code: '400050',
          country: 'India',
          is_default: true,
          address_type: 'home'
        };
        setAddresses([sample]);
        localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify([sample]));
      }
    }
  }, [user]);

  const saveAddresses = (newAddresses: Address[]) => {
    setAddresses(newAddresses);
    const stored = localStorage.getItem(ADDRESS_STORAGE_KEY);
    let all = stored ? JSON.parse(stored) : [];
    if (user) {
      all = all.filter((a: Address) => a.user_id !== user.id);
    }
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify([...all, ...newAddresses]));
  };

  if (!user) return null;

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      full_name: user.full_name,
      phone: user.phone || '',
      street: '',
      apartment: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      address_type: 'home',
      is_default: addresses.length === 0,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (addr: Address) => {
    setEditingId(addr.id);
    setFormData({ ...addr });
    setIsFormOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this delivery address?')) {
      const remaining = addresses.filter(a => a.id !== id);
      if (remaining.length > 0 && addresses.find(a => a.id === id)?.is_default) {
        remaining[0].is_default = true;
      }
      saveAddresses(remaining);
    }
  };

  const handleSetDefault = (id: string) => {
    const updated = addresses.map(a => ({
      ...a,
      is_default: a.id === id
    }));
    saveAddresses(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.street || !formData.city || !formData.state || !formData.postal_code) {
      alert('Please fill in all mandatory address fields.');
      return;
    }

    let updated: Address[];
    if (editingId) {
      updated = addresses.map(a => {
        if (a.id === editingId) {
          return { ...a, ...formData } as Address;
        }
        return formData.is_default ? { ...a, is_default: false } : a;
      });
    } else {
      const newAddr: Address = {
        id: 'addr-' + Date.now(),
        user_id: user.id,
        full_name: formData.full_name || user.full_name,
        phone: formData.phone || '',
        street: formData.street || '',
        apartment: formData.apartment || '',
        city: formData.city || '',
        state: formData.state || '',
        postal_code: formData.postal_code || '',
        country: formData.country || 'India',
        address_type: formData.address_type || 'home',
        is_default: Boolean(formData.is_default || addresses.length === 0)
      };

      if (newAddr.is_default) {
        updated = addresses.map(a => ({ ...a, is_default: false }));
        updated.push(newAddr);
      } else {
        updated = [...addresses, newAddr];
      }
    }

    saveAddresses(updated);
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-1">Saved Addresses</h1>
          <p className="text-xs text-stone-500 dark:text-stone-400">Manage your shipping and billing delivery destinations.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1a1714] dark:bg-stone-800 hover:bg-[#c46331] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Plus size={15} />
          <span>Add New Address</span>
        </button>
      </div>

      {/* Address Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className={cn(
              "p-6 rounded-3xl border bg-white dark:bg-[#16171b] shadow-sm relative flex flex-col justify-between transition-all",
              addr.is_default 
                ? "border-[#c46331] ring-1 ring-[#c46331]/30" 
                : "border-stone-200 dark:border-stone-800"
            )}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 text-[#c46331]">
                    {addr.address_type === 'work' ? <Briefcase size={14} /> : <Home size={14} />}
                  </span>
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 capitalize">
                    {addr.address_type} Address
                  </span>
                </div>
                {addr.is_default && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    Default
                  </span>
                )}
              </div>

              <div className="text-xs text-stone-600 dark:text-stone-300 space-y-1">
                <p className="font-bold text-stone-900 dark:text-stone-100">{addr.full_name}</p>
                <p>{addr.street}</p>
                {addr.apartment && <p>{addr.apartment}</p>}
                <p>{addr.city}, {addr.state} {addr.postal_code}</p>
                <p>{addr.country}</p>
                <p className="pt-2 font-mono text-stone-400">Ph: {addr.phone}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 mt-4 border-t border-stone-100 dark:border-stone-800 text-xs">
              <div>
                {!addr.is_default && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-[11px] text-stone-500 hover:text-[#c46331] font-semibold cursor-pointer"
                  >
                    Set as Default
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleOpenEdit(addr)}
                  className="p-1.5 text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                  title="Edit Address"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(addr.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  title="Delete Address"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Address Modal Drawer */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#16171b] rounded-3xl shadow-luxury max-w-lg w-full p-6 sm:p-8 border border-stone-200 dark:border-stone-800 space-y-5 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <h3 className="text-base font-serif font-bold text-stone-900 dark:text-stone-100">
                {editingId ? 'Edit Delivery Address' : 'Add New Address'}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.full_name || ''}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Street Address *</label>
                <input
                  type="text"
                  required
                  value={formData.street || ''}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="House number, building, street"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">Apartment / Suite</label>
                <input
                  type="text"
                  value={formData.apartment || ''}
                  onChange={(e) => setFormData({ ...formData, apartment: e.target.value })}
                  placeholder="Apartment, suite, landmark (optional)"
                  className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    value={formData.city || ''}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">State *</label>
                  <input
                    type="text"
                    required
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331]"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    value={formData.postal_code || ''}
                    onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                    className="w-full px-3 py-2 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="address_type"
                    value="home"
                    checked={formData.address_type === 'home'}
                    onChange={() => setFormData({ ...formData, address_type: 'home' })}
                    className="text-[#c46331]"
                  />
                  <span className="text-xs text-stone-700 dark:text-stone-300 font-medium">Home</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="address_type"
                    value="work"
                    checked={formData.address_type === 'work'}
                    onChange={() => setFormData({ ...formData, address_type: 'work' })}
                    className="text-[#c46331]"
                  />
                  <span className="text-xs text-stone-700 dark:text-stone-300 font-medium">Work / Office</span>
                </label>
              </div>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={formData.is_default}
                  onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                  className="rounded text-[#c46331]"
                />
                <span className="text-xs text-stone-700 dark:text-stone-300">Set as primary delivery address</span>
              </label>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2.5 border border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-xl text-xs font-semibold hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-[#1a1714] dark:bg-stone-800 hover:bg-[#c46331] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                >
                  Save Address
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
