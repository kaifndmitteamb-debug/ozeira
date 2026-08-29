'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { CartItem, Product, ProductVariant, Coupon } from '@/types';
import { DataStore } from '@/lib/store/data-store';
import { INITIAL_SETTINGS } from '@/lib/data/initial-data';
import { AnalyticsService } from '@/lib/services/analytics';

export interface CartToastItem {
  product: Product;
  variant?: ProductVariant;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  codFee: number;
  taxAmount: number;
  totalAmount: number;
  freeShippingThreshold: number;
  amountNeededForFreeShipping: number;
  isMiniCartOpen: boolean;
  appliedCoupon: Coupon | null;
  couponDiscount: number;
  couponMessage: string;
  loyaltyPointsToUse: number;
  loyaltyDiscount: number;
  maxLoyaltyPointsAllowed: number;
  toastItem: CartToastItem | null;
  dismissToast: () => void;
  openMiniCart: () => void;
  closeMiniCart: () => void;
  toggleMiniCart: () => void;
  addToCart: (product: Product, variantId?: string, quantity?: number) => { success: boolean; message: string };
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  setLoyaltyPointsToUse: (points: number) => void;
  shippingMethod: 'standard' | 'express';
  setShippingMethod: (method: 'standard' | 'express') => void;
  paymentMethod: 'razorpay' | 'cod';
  setPaymentMethod: (method: 'razorpay' | 'cod') => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'ozeira_cart_items_v1';
const COUPON_STORAGE_KEY = 'ozeira_applied_coupon_v1';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false);
  const [toastItem, setToastItem] = useState<CartToastItem | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [loyaltyPointsToUse, setLoyaltyPointsToUseState] = useState(0);
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express'>('standard');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'cod'>('razorpay');

  const settings = DataStore.getSettings() || INITIAL_SETTINGS;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setItems(JSON.parse(stored));
      }

      const storedCoupon = localStorage.getItem(COUPON_STORAGE_KEY);
      if (storedCoupon) {
        const coupon = JSON.parse(storedCoupon);
        setAppliedCoupon(coupon);
      }
    } catch (e) {
      console.error('Failed to load cart from storage', e);
    }
  }, []);

  const saveItems = (newItems: CartItem[]) => {
    setItems(newItems);
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems));
    } catch (e) {
      console.error('Failed to save cart to storage', e);
    }
  };

  const openMiniCart = () => setIsMiniCartOpen(true);
  const closeMiniCart = () => setIsMiniCartOpen(false);
  const toggleMiniCart = () => setIsMiniCartOpen((prev) => !prev);
  const dismissToast = () => setToastItem(null);

  const addToCart = (product: Product, variantId?: string, quantity: number = 1): { success: boolean; message: string } => {
    let variant: ProductVariant | undefined;
    if (variantId) {
      variant = product.variants?.find((v) => v.id === variantId);
    } else if (product.variants?.length > 0) {
      variant = product.variants[0];
    }

    const availableStock = variant ? variant.stock_quantity : product.total_stock;
    if (availableStock <= 0) {
      return { success: false, message: 'This item is currently out of stock.' };
    }

    const cartItemId = `${product.id}-${variant?.id || 'default'}`;
    const existingIndex = items.findIndex((i) => i.id === cartItemId);

    let updated: CartItem[];
    if (existingIndex >= 0) {
      const currentQty = items[existingIndex].quantity;
      const newQty = currentQty + quantity;
      if (newQty > availableStock) {
        return {
          success: false,
          message: `Only ${availableStock} units available in stock.`,
        };
      }
      updated = [...items];
      updated[existingIndex].quantity = newQty;
    } else {
      if (quantity > availableStock) {
        return {
          success: false,
          message: `Only ${availableStock} units available in stock.`,
        };
      }
      const newItem: CartItem = {
        id: cartItemId,
        productId: product.id,
        product,
        variantId: variant?.id,
        variant,
        quantity,
      };
      updated = [newItem, ...items];
    }

    saveItems(updated);

    // Trigger Toast Notification with Auto-Dismiss
    setToastItem({ product, variant, quantity });
    setTimeout(() => {
      setToastItem((current) => (current?.product.id === product.id ? null : current));
    }, 4500);

    // E-Commerce Analytics Tracking
    try {
      AnalyticsService.trackAddToCart({
        id: product.id,
        name: product.title,
        price: (product.sale_price ?? product.base_price) + (variant?.additional_price || 0),
        quantity: quantity,
        category: product.category_name || product.brand,
      });
    } catch {
      // safe fallback
    }

    return { success: true, message: `Added "${product.title}" to cart!` };
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    const updated = items.map((item) => {
      if (item.id === itemId) {
        const availableStock = item.variant ? item.variant.stock_quantity : item.product.total_stock;
        return {
          ...item,
          quantity: Math.min(quantity, Math.max(1, availableStock)),
        };
      }
      return item;
    });
    saveItems(updated);
  };

  const removeItem = (itemId: string) => {
    const updated = items.filter((i) => i.id !== itemId);
    saveItems(updated);
  };

  const clearCart = () => {
    saveItems([]);
    removeCoupon();
    setLoyaltyPointsToUseState(0);
  };

  // Pricing calculations
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const subtotal = items.reduce((sum, item) => {
    const basePrice = item.product.sale_price ?? item.product.base_price;
    const variantExtra = item.variant?.additional_price ?? 0;
    return sum + (basePrice + variantExtra) * item.quantity;
  }, 0);

  const freeShippingThreshold = settings?.shipping?.freeShippingThreshold ?? 2500;
  const standardShippingFee = settings?.shipping?.standardShippingFee ?? 150;
  const expressShippingFee = settings?.shipping?.expressShippingFee ?? 300;
  const codHandlingFee = settings?.cod?.handlingFee ?? 50;

  const isFreeShipping = subtotal >= freeShippingThreshold;
  const amountNeededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  let shippingFee = 0;
  if (items.length > 0) {
    if (shippingMethod === 'express') {
      shippingFee = expressShippingFee;
    } else {
      shippingFee = isFreeShipping ? 0 : standardShippingFee;
    }
  }

  const codFee = paymentMethod === 'cod' && items.length > 0 ? codHandlingFee : 0;

  // Coupon handling
  const applyCoupon = (code: string): { success: boolean; message: string } => {
    const res = DataStore.validateCoupon(code, subtotal);
    if (!res.valid || !res.coupon) {
      return { success: false, message: res.message };
    }

    setAppliedCoupon(res.coupon);
    setCouponDiscount(res.discount);
    setCouponMessage(res.message);

    try {
      localStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(res.coupon));
    } catch (e) {
      console.error('Failed to save coupon to storage', e);
    }

    return { success: true, message: res.message };
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponMessage('');
    try {
      localStorage.removeItem(COUPON_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to remove coupon from storage', e);
    }
  };

  // Recalculate coupon discount when subtotal changes
  useEffect(() => {
    if (appliedCoupon) {
      if (subtotal < appliedCoupon.min_order_amount) {
        removeCoupon();
      } else {
        let discount = 0;
        if (appliedCoupon.discount_type === 'percentage') {
          discount = (subtotal * appliedCoupon.discount_value) / 100;
          if (appliedCoupon.max_discount_amount) {
            discount = Math.min(discount, appliedCoupon.max_discount_amount);
          }
        } else {
          discount = Math.min(appliedCoupon.discount_value, subtotal);
        }
        setCouponDiscount(discount);
      }
    }
  }, [subtotal, appliedCoupon]);

  // Loyalty calculations: 100 points = ₹10 (1 point = ₹0.10)
  const POINT_VALUE_INR = 0.1;
  const MAX_LOYALTY_DISCOUNT_PERCENT = 0.3; // Max 30% of subtotal can be paid with points
  const maxLoyaltyDiscount = subtotal * MAX_LOYALTY_DISCOUNT_PERCENT;
  const maxLoyaltyPointsAllowed = Math.floor(maxLoyaltyDiscount / POINT_VALUE_INR);

  const effectiveLoyaltyPoints = Math.min(loyaltyPointsToUse, maxLoyaltyPointsAllowed);
  const loyaltyDiscount = effectiveLoyaltyPoints * POINT_VALUE_INR;

  const setLoyaltyPointsToUse = (points: number) => {
    setLoyaltyPointsToUseState(Math.max(0, Math.min(points, maxLoyaltyPointsAllowed)));
  };

  // Tax calculation (GST 12% standard on jewelry / luxury accessories)
  const gstRate = 0.12;
  const discountedSubtotal = Math.max(0, subtotal - couponDiscount - loyaltyDiscount);
  const taxAmount = Math.round(discountedSubtotal * gstRate);

  const totalAmount = Math.max(0, discountedSubtotal + shippingFee + codFee + taxAmount);

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        discountAmount: couponDiscount + loyaltyDiscount,
        shippingFee,
        codFee,
        taxAmount,
        totalAmount,
        freeShippingThreshold,
        amountNeededForFreeShipping,
        isMiniCartOpen,
        appliedCoupon,
        couponDiscount,
        couponMessage,
        loyaltyPointsToUse: effectiveLoyaltyPoints,
        loyaltyDiscount,
        maxLoyaltyPointsAllowed,
        toastItem,
        dismissToast,
        openMiniCart,
        closeMiniCart,
        toggleMiniCart,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        setLoyaltyPointsToUse,
        shippingMethod,
        setShippingMethod,
        paymentMethod,
        setPaymentMethod,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
