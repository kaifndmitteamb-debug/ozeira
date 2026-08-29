'use client';

import { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store/data-store';
import { HeroBanner, PromoBanner, Announcement } from '@/types';
import { useStore } from '@/lib/context/StoreContext';
import { cn } from '@/lib/utils';
import { Plus, Edit, Trash2, X, ArrowUp, ArrowDown, Eye } from 'lucide-react';
import Image from 'next/image';
import { ImageUploadDropzone } from '@/components/common/ImageUploadDropzone';

export default function BannersPage() {
  const { refreshData } = useStore();
  const [activeTab, setActiveTab] = useState<'hero' | 'promo' | 'announcement'>('hero');
  
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);

  // Modals state
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  
  const [heroForm, setHeroForm] = useState<Partial<HeroBanner>>({});
  const [promoForm, setPromoForm] = useState<Partial<PromoBanner>>({});

  const loadData = () => {
    setHeroBanners([...DataStore.getHeroBanners()].sort((a, b) => a.sort_order - b.sort_order));
    setPromoBanners([...DataStore.getPromoBanners()].sort((a, b) => a.sort_order - b.sort_order));
    setAnnouncement(DataStore.getAnnouncement());
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Hero Banners ---
  const openHeroModal = (banner?: HeroBanner) => {
    if (banner) {
      setHeroForm(banner);
    } else {
      setHeroForm({
        title: '', subtitle: '', button_text: '', button_url: '',
        image_url: '', background_color: '#000000', sort_order: heroBanners.length, is_active: true
      });
    }
    setIsHeroModalOpen(true);
  };

  const saveHeroBanner = (e: React.FormEvent) => {
    e.preventDefault();
    const newBanner = {
      id: heroForm.id || `hero-${Date.now()}`,
      title: heroForm.title || '',
      subtitle: heroForm.subtitle || '',
      button_text: heroForm.button_text || '',
      button_url: heroForm.button_url || '',
      image_url: heroForm.image_url || '',
      background_color: heroForm.background_color || '#000000',
      badge_text: heroForm.badge_text,
      sort_order: heroForm.sort_order || 0,
      is_active: heroForm.is_active ?? true,
      start_date: heroForm.start_date,
      end_date: heroForm.end_date,
    } as HeroBanner;

    let updated = [...heroBanners];
    const idx = updated.findIndex(b => b.id === newBanner.id);
    if (idx >= 0) updated[idx] = newBanner;
    else updated.push(newBanner);

    updated.sort((a, b) => a.sort_order - b.sort_order);
    DataStore.saveHeroBanners(updated);
    setHeroBanners(updated);
    refreshData();
    setIsHeroModalOpen(false);
  };

  const deleteHeroBanner = (id: string) => {
    if (window.confirm('Delete this banner?')) {
      const updated = heroBanners.filter(b => b.id !== id);
      DataStore.saveHeroBanners(updated);
      setHeroBanners(updated);
      refreshData();
    }
  };

  const moveHero = (idx: number, dir: 'up' | 'down') => {
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === heroBanners.length - 1) return;
    const target = dir === 'up' ? idx - 1 : idx + 1;
    const updated = [...heroBanners];
    const temp = updated[idx].sort_order;
    updated[idx].sort_order = updated[target].sort_order;
    updated[target].sort_order = temp;
    updated.sort((a, b) => a.sort_order - b.sort_order);
    DataStore.saveHeroBanners(updated);
    setHeroBanners(updated);
    refreshData();
  };

  // --- Promo Banners ---
  const openPromoModal = (banner?: PromoBanner) => {
    if (banner) {
      setPromoForm(banner);
    } else {
      setPromoForm({
        title: '', subtitle: '', link_url: '', image_url: '',
        grid_type: 'half', sort_order: promoBanners.length, is_active: true
      });
    }
    setIsPromoModalOpen(true);
  };

  const savePromoBanner = (e: React.FormEvent) => {
    e.preventDefault();
    const newBanner = {
      id: promoForm.id || `promo-${Date.now()}`,
      title: promoForm.title || '',
      subtitle: promoForm.subtitle || '',
      image_url: promoForm.image_url || '',
      link_url: promoForm.link_url || '',
      grid_type: promoForm.grid_type || 'half',
      badge_text: promoForm.badge_text,
      sort_order: promoForm.sort_order || 0,
      is_active: promoForm.is_active ?? true,
    } as PromoBanner;

    let updated = [...promoBanners];
    const idx = updated.findIndex(b => b.id === newBanner.id);
    if (idx >= 0) updated[idx] = newBanner;
    else updated.push(newBanner);

    updated.sort((a, b) => a.sort_order - b.sort_order);
    DataStore.savePromoBanners(updated);
    setPromoBanners(updated);
    refreshData();
    setIsPromoModalOpen(false);
  };

  const deletePromoBanner = (id: string) => {
    if (window.confirm('Delete this promotional block?')) {
      const updated = promoBanners.filter(b => b.id !== id);
      DataStore.savePromoBanners(updated);
      setPromoBanners(updated);
      refreshData();
    }
  };

  const movePromo = (idx: number, dir: 'up' | 'down') => {
    if (dir === 'up' && idx === 0) return;
    if (dir === 'down' && idx === promoBanners.length - 1) return;
    const target = dir === 'up' ? idx - 1 : idx + 1;
    const updated = [...promoBanners];
    const temp = updated[idx].sort_order;
    updated[idx].sort_order = updated[target].sort_order;
    updated[target].sort_order = temp;
    updated.sort((a, b) => a.sort_order - b.sort_order);
    DataStore.savePromoBanners(updated);
    setPromoBanners(updated);
    refreshData();
  };

  // --- Announcement ---
  const saveAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement) return;
    DataStore.saveAnnouncement(announcement);
    refreshData();
    alert('Announcement settings saved successfully.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Banners & Promotions</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">Manage hero slider carousels, promo tiles, and marquee bars.</p>
        </div>
        {activeTab !== 'announcement' && (
          <button
            onClick={() => (activeTab === 'hero' ? openHeroModal() : openPromoModal())}
            className="inline-flex items-center justify-center px-4 py-2 bg-brand-amber hover:bg-brand-amber-dark text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            {activeTab === 'hero' ? 'Add Hero Slide' : 'Add Promo Tile'}
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 border-b border-neutral-200 dark:border-neutral-800">
        {(['hero', 'promo', 'announcement'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2.5 text-sm font-medium transition-colors relative",
              activeTab === tab 
                ? "text-brand-amber font-semibold" 
                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
            )}
          >
            {tab === 'hero' ? 'Hero Banners' : tab === 'promo' ? 'Promo Banners' : 'Announcement Bar'}
            {activeTab === tab && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-amber" />
            )}
          </button>
        ))}
      </div>

      {/* HERO BANNERS */}
      {activeTab === 'hero' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {heroBanners.map((banner, idx) => (
            <div key={banner.id} className="bg-white dark:bg-[#14151a] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
              <div className="relative h-48 w-full bg-neutral-100 dark:bg-neutral-800" style={{ backgroundColor: banner.background_color }}>
                {banner.image_url && (
                  <Image src={banner.image_url} alt={banner.title} fill className="object-cover" />
                )}
                {!banner.is_active && (
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 uppercase rounded">Inactive</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-base text-neutral-900 dark:text-neutral-100 truncate pr-2">{banner.title}</h3>
                  <div className="flex space-x-1 shrink-0">
                    <button onClick={() => moveHero(idx, 'up')} disabled={idx === 0} className="p-1 text-neutral-400 hover:text-brand-amber disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                    <button onClick={() => moveHero(idx, 'down')} disabled={idx === heroBanners.length - 1} className="p-1 text-neutral-400 hover:text-brand-amber disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                  </div>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-1 mb-4">{banner.subtitle}</p>
                <div className="flex justify-between items-center pt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-mono text-neutral-400">Order: {banner.sort_order}</span>
                  <div className="flex space-x-3">
                    <button onClick={() => openHeroModal(banner)} className="text-neutral-500 dark:text-neutral-400 hover:text-brand-amber dark:hover:text-brand-amber text-xs font-medium flex items-center"><Edit className="w-3.5 h-3.5 mr-1" /> Edit</button>
                    <button onClick={() => deleteHeroBanner(banner.id)} className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center"><Trash2 className="w-3.5 h-3.5 mr-1" /> Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PROMO BANNERS */}
      {activeTab === 'promo' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promoBanners.map((banner, idx) => (
            <div key={banner.id} className="bg-white dark:bg-[#14151a] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm">
              <div className="relative h-40 w-full bg-neutral-100 dark:bg-neutral-800">
                {banner.image_url && <Image src={banner.image_url} alt={banner.title} fill className="object-cover" />}
                <div className="absolute bottom-2 right-2 bg-white/90 dark:bg-black/90 text-neutral-900 dark:text-neutral-100 text-[10px] px-2 py-0.5 uppercase font-bold rounded">{banner.grid_type}</div>
                {!banner.is_active && (
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 uppercase rounded">Inactive</div>
                )}
              </div>
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 truncate pr-2">{banner.title}</h3>
                  <div className="flex space-x-1 shrink-0">
                    <button onClick={() => movePromo(idx, 'up')} disabled={idx === 0} className="p-1 text-neutral-400 hover:text-brand-amber disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                    <button onClick={() => movePromo(idx, 'down')} disabled={idx === promoBanners.length - 1} className="p-1 text-neutral-400 hover:text-brand-amber disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-3 mt-3 border-t border-neutral-100 dark:border-neutral-800">
                  <span className="text-xs font-mono text-neutral-400">Order: {banner.sort_order}</span>
                  <div className="flex space-x-3">
                    <button onClick={() => openPromoModal(banner)} className="text-neutral-500 dark:text-neutral-400 hover:text-brand-amber dark:hover:text-brand-amber text-xs font-medium flex items-center"><Edit className="w-3.5 h-3.5 mr-1" /> Edit</button>
                    <button onClick={() => deletePromoBanner(banner.id)} className="text-red-500 hover:text-red-700 text-xs font-medium flex items-center"><Trash2 className="w-3.5 h-3.5 mr-1" /> Delete</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ANNOUNCEMENT */}
      {activeTab === 'announcement' && announcement && (
        <div className="max-w-2xl bg-white dark:bg-[#14151a] border border-neutral-200 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
          <form onSubmit={saveAnnouncement} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Announcement Text</label>
              <input
                type="text"
                value={announcement.text}
                onChange={e => setAnnouncement({...announcement, text: e.target.value})}
                className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-amber"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Link URL (Optional)</label>
              <input
                type="text"
                value={announcement.link_url || ''}
                onChange={e => setAnnouncement({...announcement, link_url: e.target.value})}
                className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand-amber"
                placeholder="/shop"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Background Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={announcement.bg_color}
                    onChange={e => setAnnouncement({...announcement, bg_color: e.target.value})}
                    className="h-9 w-9 border-0 p-0 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={announcement.bg_color}
                    onChange={e => setAnnouncement({...announcement, bg_color: e.target.value})}
                    className="flex-1 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">Text Color</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={announcement.text_color}
                    onChange={e => setAnnouncement({...announcement, text_color: e.target.value})}
                    className="h-9 w-9 border-0 p-0 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={announcement.text_color}
                    onChange={e => setAnnouncement({...announcement, text_color: e.target.value})}
                    className="flex-1 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 font-mono text-sm focus:outline-none"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-2">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={announcement.is_active}
                  onChange={(e) => setAnnouncement({ ...announcement, is_active: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ms-3 text-sm font-medium text-neutral-700 dark:text-neutral-300">Bar Active on Storefront</span>
              </label>
            </div>

            <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800">
              <h4 className="text-sm font-medium text-neutral-500 dark:text-neutral-400 mb-2">Live Preview:</h4>
              <div 
                className="w-full py-2 px-4 text-center text-sm rounded-lg"
                style={{ backgroundColor: announcement.bg_color, color: announcement.text_color }}
              >
                {announcement.text || 'Your announcement text here'}
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button type="submit" className="px-6 py-2.5 bg-brand-amber hover:bg-brand-amber-dark text-white rounded-lg text-sm font-semibold transition-colors">
                Save Announcement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HERO MODAL */}
      {isHeroModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#14151a] text-neutral-900 dark:text-neutral-100 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-[#14151a] z-10">
              <h2 className="text-lg font-semibold text-brand-amber">{heroForm.id ? 'Edit Hero' : 'Add Hero'}</h2>
              <button onClick={() => setIsHeroModalOpen(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={saveHeroBanner} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">Title</label>
                <input type="text" required value={heroForm.title || ''} onChange={e => setHeroForm({...heroForm, title: e.target.value})} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber" />
              </div>
              <div>
                <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">Subtitle</label>
                <input type="text" required value={heroForm.subtitle || ''} onChange={e => setHeroForm({...heroForm, subtitle: e.target.value})} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">Button Text</label>
                  <input type="text" required value={heroForm.button_text || ''} onChange={e => setHeroForm({...heroForm, button_text: e.target.value})} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber" />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">Button URL</label>
                  <input type="text" required value={heroForm.button_url || ''} onChange={e => setHeroForm({...heroForm, button_url: e.target.value})} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber" />
                </div>
              </div>
              <div>
                <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">Banner Image (Supabase Bucket: ozeira-banners)</label>
                <ImageUploadDropzone
                  bucket="ozeira-banners"
                  folder="hero"
                  currentImageUrl={heroForm.image_url}
                  onImageUploaded={(url) => setHeroForm({ ...heroForm, image_url: url })}
                  onImageRemoved={() => setHeroForm({ ...heroForm, image_url: '' })}
                  aspectRatio="wide"
                  label=""
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">Badge Text (Optional)</label>
                <input type="text" value={heroForm.badge_text || ''} onChange={e => setHeroForm({...heroForm, badge_text: e.target.value})} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber" />
              </div>
              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={heroForm.is_active} onChange={e => setHeroForm({...heroForm, is_active: e.target.checked})} className="sr-only peer" />
                  <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  <span className="ms-3 font-medium text-neutral-700 dark:text-neutral-300">Active</span>
                </label>
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-neutral-100 dark:border-neutral-800">
                <button type="button" onClick={() => setIsHeroModalOpen(false)} className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-amber hover:bg-brand-amber-dark text-white font-medium rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROMO MODAL */}
      {isPromoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#14151a] text-neutral-900 dark:text-neutral-100 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 sticky top-0 bg-white dark:bg-[#14151a] z-10">
              <h2 className="text-lg font-semibold text-brand-amber">{promoForm.id ? 'Edit Promo' : 'Add Promo'}</h2>
              <button onClick={() => setIsPromoModalOpen(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={savePromoBanner} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">Title</label>
                <input type="text" required value={promoForm.title || ''} onChange={e => setPromoForm({...promoForm, title: e.target.value})} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber" />
              </div>
              <div>
                <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">Subtitle</label>
                <input type="text" required value={promoForm.subtitle || ''} onChange={e => setPromoForm({...promoForm, subtitle: e.target.value})} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber" />
              </div>
              <div>
                <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">Promo Image (Supabase Bucket: ozeira-banners)</label>
                <ImageUploadDropzone
                  bucket="ozeira-banners"
                  folder="promo"
                  currentImageUrl={promoForm.image_url}
                  onImageUploaded={(url) => setPromoForm({ ...promoForm, image_url: url })}
                  onImageRemoved={() => setPromoForm({ ...promoForm, image_url: '' })}
                  aspectRatio="video"
                  label=""
                />
              </div>
              <div>
                <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">Link URL</label>
                <input type="text" required value={promoForm.link_url || ''} onChange={e => setPromoForm({...promoForm, link_url: e.target.value})} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">Grid Type</label>
                  <select value={promoForm.grid_type} onChange={e => setPromoForm({...promoForm, grid_type: e.target.value as 'half'|'third'|'full'})} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber">
                    <option value="half">Half Width</option>
                    <option value="third">Third Width</option>
                    <option value="full">Full Width</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1 text-neutral-700 dark:text-neutral-300">Badge Text (Optional)</label>
                  <input type="text" value={promoForm.badge_text || ''} onChange={e => setPromoForm({...promoForm, badge_text: e.target.value})} className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber" />
                </div>
              </div>
              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={promoForm.is_active} onChange={e => setPromoForm({...promoForm, is_active: e.target.checked})} className="sr-only peer" />
                  <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  <span className="ms-3 font-medium text-neutral-700 dark:text-neutral-300">Active</span>
                </label>
              </div>
              <div className="pt-4 flex justify-end space-x-3 border-t border-neutral-100 dark:border-neutral-800">
                <button type="button" onClick={() => setIsPromoModalOpen(false)} className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-brand-amber hover:bg-brand-amber-dark text-white font-medium rounded-lg">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
