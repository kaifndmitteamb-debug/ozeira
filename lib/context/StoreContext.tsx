'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Product,
  Category,
  HeroBanner,
  PromoBanner,
  Announcement,
  Coupon,
  OfferCampaign,
  StoreSettings,
  Review,
} from '@/types';
import { DataStore } from '@/lib/store/data-store';
import { INITIAL_SETTINGS } from '@/lib/data/initial-data';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

interface StoreContextType {
  products: Product[];
  categories: Category[];
  heroBanners: HeroBanner[];
  promoBanners: PromoBanner[];
  announcement: Announcement;
  settings: StoreSettings;
  coupons: Coupon[];
  offers: OfferCampaign[];
  refreshData: () => void;
  getProductBySlug: (slug: string) => Product | undefined;
  getProductById: (id: string) => Product | undefined;
  getReviewsForProduct: (productId: string) => Review[];
  submitReview: (data: {
    productId: string;
    userId?: string;
    userName: string;
    rating: number;
    title: string;
    comment: string;
    images?: string[];
  }) => { success: boolean; message: string };
  subscribeRestock: (productId: string, email: string, phone?: string, variantId?: string) => { success: boolean; message: string };
  subscribeNewsletter: (email: string) => { success: boolean; message: string };
  submitContactForm: (data: { name: string; email: string; phone?: string; subject: string; message: string }) => {
    success: boolean;
    message: string;
  };
  isLiveChatOpen: boolean;
  toggleLiveChat: () => void;
  closeLiveChat: () => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>([]);
  const [announcement, setAnnouncement] = useState<Announcement>(DataStore.getAnnouncement());
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [offers, setOffers] = useState<OfferCampaign[]>([]);
  const [isLiveChatOpen, setIsLiveChatOpen] = useState(false);

  const refreshData = useCallback(() => {
    setProducts(DataStore.getProducts());
    setCategories(DataStore.getCategories());
    setHeroBanners(DataStore.getHeroBanners());
    setPromoBanners(DataStore.getPromoBanners());
    setAnnouncement(DataStore.getAnnouncement());
    setSettings(DataStore.getSettings());
    setCoupons(DataStore.getCoupons());
    setOffers(DataStore.getOffers());
  }, []);

  useEffect(() => {
    refreshData();

    // 1. Listen for local DataStore changes across tabs and within same window
    const handleDataChange = () => {
      refreshData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ozeira_datastore_change', handleDataChange);
      window.addEventListener('storage', handleDataChange);
    }

    // 2. Initial hydration from Supabase
    DataStore.syncFromSupabase().then(() => {
      refreshData();
    });

    // 3. Realtime subscription to live postgres changes
    if (isSupabaseConfigured) {
      const channel = supabase
        .channel('ozeira-store-realtime')
        .on('postgres_changes', { event: '*', schema: 'public' }, () => {
          DataStore.syncFromSupabase().then(() => {
            refreshData();
          });
        })
        .subscribe();

      return () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('ozeira_datastore_change', handleDataChange);
          window.removeEventListener('storage', handleDataChange);
        }
        supabase.removeChannel(channel);
      };
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('ozeira_datastore_change', handleDataChange);
        window.removeEventListener('storage', handleDataChange);
      }
    };
  }, [refreshData]);

  const getProductBySlug = (slug: string) => products.find((p) => p.slug === slug);
  const getProductById = (id: string) => products.find((p) => p.id === id);
  const getReviewsForProduct = (productId: string) => DataStore.getReviews(productId);

  const submitReview = (data: {
    productId: string;
    userId?: string;
    userName: string;
    rating: number;
    title: string;
    comment: string;
    images?: string[];
  }) => {
    DataStore.addReview({
      product_id: data.productId,
      user_id: data.userId,
      user_name: data.userName,
      rating: data.rating,
      title: data.title,
      comment: data.comment,
      images: data.images || [],
      is_verified_purchase: true,
    });
    refreshData();
    return {
      success: true,
      message: 'Thank you for your review! 100 loyalty points have been credited to your account.',
    };
  };

  const subscribeRestock = (productId: string, email: string, phone?: string, variantId?: string) => {
    DataStore.addRestockRequest({
      productId,
      variantId,
      email,
      phone,
    });
    return {
      success: true,
      message: "You're all set! We'll notify you via email and SMS the moment this piece is back in stock.",
    };
  };

  const subscribeNewsletter = (email: string) => {
    const ok = DataStore.addSubscriber(email);
    if (ok) {
      return {
        success: true,
        message: 'Welcome to the Ozeira circle! Use code LUXE10 for 10% off your next order.',
      };
    }
    return {
      success: false,
      message: 'This email is already subscribed to Ozeira private announcements.',
    };
  };

  const submitContactForm = (data: { name: string; email: string; phone?: string; subject: string; message: string }) => {
    DataStore.addContactMessage(data);
    return {
      success: true,
      message: 'Your message has been received by our concierge team. We will reply within 24 hours.',
    };
  };

  const toggleLiveChat = () => setIsLiveChatOpen((prev) => !prev);
  const closeLiveChat = () => setIsLiveChatOpen(false);

  return (
    <StoreContext.Provider
      value={{
        products,
        categories,
        heroBanners,
        promoBanners,
        announcement,
        settings,
        coupons,
        offers,
        refreshData,
        getProductBySlug,
        getProductById,
        getReviewsForProduct,
        submitReview,
        subscribeRestock,
        subscribeNewsletter,
        submitContactForm,
        isLiveChatOpen,
        toggleLiveChat,
        closeLiveChat,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
