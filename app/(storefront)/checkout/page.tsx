'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  Banknote,
  Truck,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Lock,
  Sparkles,
  AlertCircle,
  KeyRound,
  X,
} from 'lucide-react';
import { useCart } from '@/lib/context/CartContext';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useStore } from '@/lib/context/StoreContext';
import { Address, PaymentMethod } from '@/types';
import { DataStore } from '@/lib/store/data-store';
import { AnalyticsService } from '@/lib/services/analytics';
import { AbandonedCartService } from '@/lib/services/abandoned-cart-service';
import { SupplierService } from '@/lib/services/supplier-service';
import { cn } from '@/lib/utils';

function CheckoutPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin, isOrderManager, logout } = useAuth();
  const { settings } = useStore();
  const {
    items,
    itemCount,
    subtotal,
    discountAmount,
    couponDiscount,
    loyaltyDiscount,
    loyaltyPointsToUse,
    shippingFee,
    codFee,
    taxAmount,
    totalAmount,
    appliedCoupon,
    shippingMethod,
    setShippingMethod,
    paymentMethod,
    setPaymentMethod,
    applyCoupon,
    clearCart,
  } = useCart();
  const { formatAmount } = useCurrency();

  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // COD OTP State
  const [showCodOtpModal, setShowCodOtpModal] = useState(false);
  const [codOtpInput, setCodOtpInput] = useState('');
  const [sentOtpCode, setSentOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');

  // Shipping Address State
  const [address, setAddress] = useState<Address>({
    id: `addr-${Date.now()}`,
    user_id: user?.id || 'guest',
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    street: '',
    apartment: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'India',
    is_default: true,
    address_type: 'home',
  });

  const [guestEmail, setGuestEmail] = useState(user?.email || '');
  const [customerNotes, setCustomerNotes] = useState('');

  // Handle URL coupon parameter (e.g. from abandoned cart recovery email)
  useEffect(() => {
    const couponParam = searchParams.get('coupon');
    if (couponParam) {
      applyCoupon(couponParam);
    }
  }, [searchParams, applyCoupon]);

  // Track begin checkout in analytics
  useEffect(() => {
    if (items.length > 0) {
      AnalyticsService.trackBeginCheckout(
        items.map((i) => ({
          id: i.productId,
          name: i.product.title,
          price: (i.product.sale_price ?? i.product.base_price) + (i.variant?.additional_price || 0),
          quantity: i.quantity,
        })),
        totalAmount
      );
    }
  }, []);

  // Loading animation state during order placement
  if (isProcessing) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 text-center animate-fade-in">
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-full border-4 border-amber-200/50 dark:border-amber-900/30 border-t-[#c46331] animate-spin flex items-center justify-center shadow-luxury-lg"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-[#c46331] animate-pulse" />
          </div>
        </div>
        <h2 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100 mb-3 tracking-tight">
          Securing Your Order...
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 max-w-md mx-auto leading-relaxed">
          Please hold on while we reserve your bespoke pieces with the atelier and generate your confirmed tracking receipt.
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-xs font-semibold text-[#c46331]">
          <span className="inline-block w-2 h-2 rounded-full bg-[#c46331] animate-ping" />
          <span>Processing with Ozeira Vault...</span>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-4 animate-fade-in">
        <h1 className="font-serif text-3xl font-bold text-stone-900 dark:text-stone-100">Your Shopping Bag is Empty</h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">Please add items to your cart before proceeding to checkout.</p>
        <Link
          href="/shop"
          className="inline-block px-8 py-3 bg-[#1a1714] text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-[#c46331] transition-all shadow-md"
        >
          Explore Collection
        </Link>
      </div>
    );
  }

  // COD Rules
  const codSettings = settings?.cod || { isEnabled: true, handlingFee: 49, eligiblePincodes: ['*'] };
  const codFraudSettings = settings?.codFraud || { requireOtp: true, maxCodAmount: 5000, blockedPincodes: [], blockedPhones: [] };

  const isPincodeBlocked = codFraudSettings.blockedPincodes?.includes(address.postal_code.trim());
  const isPincodeCodEligible =
    codSettings.isEnabled &&
    !isPincodeBlocked &&
    (codSettings.eligiblePincodes.includes('*') || codSettings.eligiblePincodes.includes(address.postal_code.trim()));

  const validateStep1 = () => {
    if (!address.full_name.trim()) return 'Please enter your full name.';
    if (!guestEmail.trim() || !guestEmail.includes('@')) return 'Please enter a valid email address.';
    if (!address.street.trim()) return 'Please enter your delivery street address.';
    if (!address.city.trim()) return 'Please enter your city.';
    if (!address.state.trim()) return 'Please enter your state.';
    if (!address.postal_code.trim()) return 'Please enter your postal pincode.';
    return null;
  };

  const handleNextStep = () => {
    setErrorMsg('');
    if (currentStep === 1) {
      const err = validateStep1();
      if (err) {
        setErrorMsg(err);
        return;
      }
      // Record cart session for abandoned cart recovery
      AbandonedCartService.recordCartSession(guestEmail || user?.email || '', items, address.phone, user?.id);
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (paymentMethod === 'cod') {
        if (!isPincodeCodEligible) {
          setErrorMsg('Cash on Delivery is not available for this postal code. Please choose Online Payment.');
          return;
        }
        const maxLimit = codFraudSettings.maxCodAmount ?? 5000;
        if (maxLimit > 0 && maxLimit < 999999 && totalAmount > maxLimit) {
          setErrorMsg(`Cash on Delivery is limited to orders up to ${formatAmount(maxLimit)} to protect against transit loss. Please select Online Payment.`);
          return;
        }
      }
      setCurrentStep(4);
    }
  };

  const handlePlaceOrderClick = () => {
    setErrorMsg('');

    // Block Admins & Staff from placing customer orders
    if (isAdmin || isOrderManager || user?.role === 'admin' || user?.role === 'order_manager') {
      setErrorMsg('Admin accounts cannot place customer orders. Please sign out and use a customer account or guest checkout.');
      return;
    }

    // COD Fraud OTP Verification
    if (paymentMethod === 'cod' && codFraudSettings.requireOtp !== false) {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSentOtpCode(code);
      setCodOtpInput('');
      setOtpError('');
      setShowCodOtpModal(true);
      return;
    }

    // Proceed to place order directly
    executeOrderPlacement();
  };

  const executeOrderPlacement = async () => {
    setIsProcessing(true);
    setErrorMsg('');

    try {
      const order = DataStore.createOrder({
        user_id: user?.id,
        user_name: address.full_name.trim(),
        guest_email: guestEmail.trim() || user?.email || '',
        guest_phone: address.phone?.trim() || user?.phone || '',
        status: 'confirmed',
        subtotal,
        discount_amount: discountAmount,
        coupon_id: appliedCoupon?.id,
        coupon_code: appliedCoupon?.code,
        loyalty_points_used: loyaltyPointsToUse,
        loyalty_discount_amount: loyaltyDiscount,
        shipping_fee: shippingFee,
        cod_fee: codFee,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'cod' ? 'pending' : 'paid',
        razorpay_payment_id:
          paymentMethod === 'razorpay' ? `pay_rzp_${Date.now()}_${Math.floor(Math.random() * 1000)}` : undefined,
        shipping_address: address,
        customer_notes: customerNotes.trim(),
        items: items.map((item) => {
          const unitPrice =
            (item.product.sale_price ?? item.product.base_price) + (item.variant?.additional_price || 0);
          return {
            id: `item-${Date.now()}-${Math.random()}`,
            order_id: '',
            product_id: item.product.id,
            variant_id: item.variantId,
            product_title: item.product.title,
            variant_details: item.variant
              ? { size: item.variant.size, color: item.variant.color, sku: item.variant.sku }
              : undefined,
            quantity: item.quantity,
            unit_price: unitPrice,
            total_price: unitPrice * item.quantity,
            product_image: item.variant?.image_url || item.product.images[0]?.image_url,
          };
        }),
      });

      // Track purchase event in GA4 & Meta Pixel
      AnalyticsService.trackPurchase({
        id: order.id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        items: order.items,
      });

      // Mark abandoned cart as recovered
      AbandonedCartService.markCartRecovered(guestEmail || user?.email || '');

      // Trigger Automated Dropshipping & Supplier Fulfillment Routing
      try {
        SupplierService.handleOrderPlaced(order);
      } catch (suppErr) {
        console.warn('Supplier auto-fulfillment error:', suppErr);
      }

      // Clear cart
      clearCart();

      // Redirect to Order Confirmation Success Page
      router.push(`/order-success/${order.id}`);
    } catch (e: any) {
      console.error('Order placement error', e);
      setErrorMsg('Failed to process your order. Please try again.');
      setIsProcessing(false);
    }
  };

  const handleVerifyCodOtp = () => {
    if (codOtpInput.trim() !== sentOtpCode) {
      setOtpError('Invalid verification code. Please check and re-enter the 6-digit code.');
      return;
    }
    setShowCodOtpModal(false);
    executeOrderPlacement();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Admin Notice Banner if logged in as Admin */}
      {(isAdmin || isOrderManager) && (
        <div className="max-w-3xl mx-auto mb-8 p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center justify-between gap-4 text-amber-900 dark:text-amber-200 shadow-xs">
          <div className="flex items-start gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-[#c46331] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Admin/Staff Account Detected ({user?.email})</p>
              <p className="text-amber-800 dark:text-amber-300 mt-0.5 leading-relaxed">
                To test order placement as a patron, please sign out and proceed with guest checkout.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="px-3.5 py-1.5 bg-[#c46331] hover:bg-[#a34c28] text-white text-[11px] font-bold uppercase tracking-wider rounded-xl shrink-0 transition-colors shadow-xs"
          >
            Sign Out to Test
          </button>
        </div>
      )}

      {/* Checkout Progress Stepper */}
      <div className="max-w-3xl mx-auto mb-10">
        <div className="flex items-center justify-between relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 w-full bg-stone-200 dark:bg-stone-800 -z-0" />
          {[
            { step: 1, label: 'Address' },
            { step: 2, label: 'Delivery' },
            { step: 3, label: 'Payment' },
            { step: 4, label: 'Review' },
          ].map((s) => (
            <div key={s.step} className="relative z-10 flex flex-col items-center bg-[#fdfbf9] dark:bg-stone-950 px-3">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  currentStep >= s.step
                    ? 'bg-[#c46331] text-white ring-4 ring-[#fdf8f4] dark:ring-stone-900'
                    : 'bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                {currentStep > s.step ? <CheckCircle2 className="w-5 h-5" /> : s.step}
              </div>
              <span
                className={`text-[11px] font-bold uppercase tracking-wider mt-1.5 ${
                  currentStep >= s.step ? 'text-stone-900 dark:text-stone-100' : 'text-stone-400 dark:text-stone-500'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left Form Area (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          {errorMsg && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-xl text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Shipping Address */}
          {currentStep === 1 && (
            <div className="bg-white dark:bg-[#14151a] p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-5 animate-fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-[#c46331]" />
                  <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">Shipping Address</h2>
                </div>
                {!user && (
                  <Link href="/auth/login" className="text-xs font-semibold text-[#c46331] hover:underline">
                    Have an account? Log in
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="sm:col-span-2">
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kavya Sharma"
                    value={address.full_name}
                    onChange={(e) => setAddress({ ...address, full_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1a17] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-xl focus:border-[#c46331] outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Email Address * (For Receipt & Tracking)</label>
                  <input
                    type="email"
                    required
                    placeholder="kavya@example.com"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1a17] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-xl focus:border-[#c46331] outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">
                    Phone Number <span className="text-stone-400 dark:text-stone-500 font-normal">(Optional - For SMS Delivery Updates)</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210 (optional)"
                    value={address.phone || ''}
                    onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1a17] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-xl focus:border-[#c46331] outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Street Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="House / Flat / Road Name"
                    value={address.street}
                    onChange={(e) => setAddress({ ...address, street: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1a17] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-xl focus:border-[#c46331] outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Apartment / Landmark</label>
                  <input
                    type="text"
                    placeholder="Apt, Suite, Floor (optional)"
                    value={address.apartment || ''}
                    onChange={(e) => setAddress({ ...address, apartment: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1a17] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-xl focus:border-[#c46331] outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mumbai"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1a17] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-xl focus:border-[#c46331] outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">State *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maharashtra"
                    value={address.state}
                    onChange={(e) => setAddress({ ...address, state: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1a17] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-xl focus:border-[#c46331] outline-none"
                  />
                </div>

                <div>
                  <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">PIN Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 400050"
                    value={address.postal_code}
                    onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-white dark:bg-[#1c1a17] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-xl focus:border-[#c46331] outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-8 py-3.5 bg-[#c46331] hover:bg-[#a34c28] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2 transition-colors"
                >
                  <span>Continue to Delivery</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Delivery Method */}
          {currentStep === 2 && (
            <div className="bg-white dark:bg-[#14151a] p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
                <Truck className="w-5 h-5 text-[#c46331]" />
                <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">Select Delivery Method</h2>
              </div>

              <div className="space-y-3 text-xs">
                {/* Standard Shipping */}
                <label
                  onClick={() => setShippingMethod('standard')}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    shippingMethod === 'standard'
                      ? 'border-[#c46331] bg-[#fdf8f4] dark:bg-amber-950/20 ring-1 ring-[#c46331]'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-[#1c1a17]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping_method"
                      checked={shippingMethod === 'standard'}
                      onChange={() => setShippingMethod('standard')}
                      className="accent-[#c46331] w-4 h-4"
                    />
                    <div>
                      <p className="font-bold text-stone-900 dark:text-stone-100">Standard Insured Delivery (3-5 Business Days)</p>
                      <p className="text-stone-500 dark:text-stone-400 mt-0.5">Complimentary for orders above ₹1,999</p>
                    </div>
                  </div>
                  <span className="font-bold text-stone-900 dark:text-stone-100">
                    {subtotal >= 1999 ? 'FREE' : formatAmount(99)}
                  </span>
                </label>

                {/* Priority Express Air */}
                <label
                  onClick={() => setShippingMethod('express')}
                  className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    shippingMethod === 'express'
                      ? 'border-[#c46331] bg-[#fdf8f4] dark:bg-amber-950/20 ring-1 ring-[#c46331]'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-[#1c1a17]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="shipping_method"
                      checked={shippingMethod === 'express'}
                      onChange={() => setShippingMethod('express')}
                      className="accent-[#c46331] w-4 h-4"
                    />
                    <div>
                      <p className="font-bold text-stone-900 dark:text-stone-100">Priority Express Air (1-2 Business Days)</p>
                      <p className="text-stone-500 dark:text-stone-400 mt-0.5">Dispatched via dedicated Bluedart / Air cargo</p>
                    </div>
                  </div>
                  <span className="font-bold text-[#c46331]">{formatAmount(249)}</span>
                </label>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-6 py-3 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold uppercase rounded-xl flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-8 py-3.5 bg-[#c46331] hover:bg-[#a34c28] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2"
                >
                  <span>Continue to Payment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment Options */}
          {currentStep === 3 && (
            <div className="bg-white dark:bg-[#14151a] p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
                <CreditCard className="w-5 h-5 text-[#c46331]" />
                <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">Choose Payment Method</h2>
              </div>

              <div className="space-y-4 text-xs">
                {/* Razorpay Online */}
                <label
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-5 rounded-2xl border flex flex-col gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'razorpay'
                      ? 'border-[#c46331] bg-[#fdf8f4] dark:bg-amber-950/20 ring-1 ring-[#c46331]'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-[#1c1a17]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === 'razorpay'}
                        onChange={() => setPaymentMethod('razorpay')}
                        className="accent-[#c46331] w-4 h-4"
                      />
                      <div>
                        <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">Online Payment (Razorpay Secure)</p>
                        <p className="text-stone-500 dark:text-stone-400 mt-0.5">Credit/Debit Cards, UPI (GPay/PhonePe), Netbanking, Wallets</p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold rounded text-[10px]">
                      Recommended
                    </span>
                  </div>

                  {paymentMethod === 'razorpay' && (
                    <div className="p-3 bg-white dark:bg-[#14151a] rounded-xl border border-stone-200 dark:border-stone-800 text-[11px] text-stone-600 dark:text-stone-400 space-y-1">
                      <p className="flex items-center gap-1.5 text-stone-800 dark:text-stone-200 font-medium">
                        <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        PCI-DSS Level 1 Encrypted Payment Gateway
                      </p>
                      <p className="text-stone-500 dark:text-stone-400">
                        Supports Visa, Mastercard, American Express, RuPay, Google Pay, PhonePe, Paytm & Netbanking.
                      </p>
                    </div>
                  )}
                </label>

                {/* Cash On Delivery (COD) */}
                <label
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-5 rounded-2xl border flex flex-col gap-3 cursor-pointer transition-all ${
                    paymentMethod === 'cod'
                      ? 'border-[#c46331] bg-[#fdf8f4] dark:bg-amber-950/20 ring-1 ring-[#c46331]'
                      : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 bg-white dark:bg-[#1c1a17]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment_method"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="accent-[#c46331] w-4 h-4"
                      />
                      <div>
                        <p className="font-bold text-stone-900 dark:text-stone-100 text-sm">Cash on Delivery (COD)</p>
                        <p className="text-stone-500 dark:text-stone-400 mt-0.5">Pay in cash or UPI at your doorstep upon delivery</p>
                      </div>
                    </div>
                    <span className="font-bold text-stone-700 dark:text-stone-300">+{formatAmount(codSettings.handlingFee || 49)} Fee</span>
                  </div>

                  {paymentMethod === 'cod' && (
                    <div className="p-3 bg-white dark:bg-[#14151a] rounded-xl border border-stone-200 dark:border-stone-800 text-[11px] space-y-1">
                      {isPincodeCodEligible ? (
                        <p className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          COD is available for PIN {address.postal_code}.
                        </p>
                      ) : (
                        <p className="text-rose-600 dark:text-rose-400 font-semibold">
                          COD is not available for PIN {address.postal_code}. Please choose online payment.
                        </p>
                      )}
                      {(codFraudSettings.maxCodAmount ?? 5000) > 0 && (codFraudSettings.maxCodAmount ?? 5000) < 999999 && (
                        <p className={cn(
                          "text-[10px]",
                          totalAmount > (codFraudSettings.maxCodAmount ?? 5000)
                            ? "text-rose-600 dark:text-rose-400 font-bold"
                            : "text-stone-500 dark:text-stone-400"
                        )}>
                          • Maximum allowed order value for Cash on Delivery: {formatAmount(codFraudSettings.maxCodAmount ?? 5000)}
                        </p>
                      )}
                    </div>
                  )}
                </label>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold uppercase rounded-xl flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-8 py-3.5 bg-[#c46331] hover:bg-[#a34c28] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md flex items-center gap-2"
                >
                  <span>Review Order</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review & Place Order */}
          {currentStep === 4 && (
            <div className="bg-white dark:bg-[#14151a] p-6 sm:p-8 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6 animate-fade-in">
              <div className="flex items-center gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
                <ShieldCheck className="w-5 h-5 text-[#c46331]" />
                <h2 className="font-serif text-xl font-bold text-stone-900 dark:text-stone-100">Final Order Review</h2>
              </div>

              {/* Delivery Address Review */}
              <div className="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-stone-900 dark:text-stone-100">
                  <span>Shipping To:</span>
                  <button onClick={() => setCurrentStep(1)} className="text-[#c46331] hover:underline">
                    Edit
                  </button>
                </div>
                <p className="font-semibold text-stone-800 dark:text-stone-200">{address.full_name} ({address.phone})</p>
                <p className="text-stone-600 dark:text-stone-400">{address.street}, {address.apartment && `${address.apartment}, `}{address.city}, {address.state} - {address.postal_code}</p>
                <p className="text-stone-500 dark:text-stone-400">Email: {guestEmail}</p>
              </div>

              {/* Method Review */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800">
                  <span className="text-stone-500 dark:text-stone-400 block mb-1">Delivery Speed:</span>
                  <strong className="text-stone-900 dark:text-stone-100 font-bold uppercase">
                    {shippingMethod === 'express' ? 'Priority Express Air' : 'Standard Insured'}
                  </strong>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-stone-900/60 rounded-xl border border-stone-200 dark:border-stone-800">
                  <span className="text-stone-500 dark:text-stone-400 block mb-1">Payment Method:</span>
                  <strong className="text-stone-900 dark:text-stone-100 font-bold uppercase">
                    {paymentMethod === 'razorpay' ? 'Razorpay Online' : 'Cash on Delivery'}
                  </strong>
                </div>
              </div>

              {/* Optional Special Instructions */}
              <div className="text-xs">
                <label className="font-semibold text-stone-700 dark:text-stone-300 block mb-1">Special Delivery Instructions (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Leave with security desk, ring bell twice..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-[#1c1a17] text-stone-900 dark:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-xl outline-none focus:border-[#c46331]"
                />
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  className="px-6 py-3 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold uppercase rounded-xl flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> <span>Back</span>
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrderClick}
                  disabled={isProcessing}
                  className="px-10 py-4 bg-[#c46331] hover:bg-[#a34c28] text-white text-xs font-bold uppercase tracking-widest rounded-2xl shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing ? (
                    <span>Processing Order...</span>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Authorize & Place Order ({formatAmount(totalAmount)})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Summary Sidebar (Col 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-white dark:bg-[#14151a] border border-stone-200 dark:border-stone-800 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 pb-3 border-b border-stone-100 dark:border-stone-800">
              Bag Summary ({itemCount} items)
            </h3>

            {/* Line items mini view */}
            <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 pr-1">
              {items.map((item) => {
                const unitPrice =
                  (item.product.sale_price ?? item.product.base_price) + (item.variant?.additional_price || 0);
                return (
                  <div key={item.id} className="pt-2 first:pt-0 flex items-center gap-3">
                    <img
                      src={item.variant?.image_url || item.product.images[0]?.image_url}
                      alt=""
                      className="w-12 h-14 object-cover rounded-lg bg-stone-100 dark:bg-stone-800 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-semibold text-stone-900 dark:text-stone-100 truncate">{item.product.title}</p>
                      <p className="text-stone-500 dark:text-stone-400 text-[11px]">
                        Qty: {item.quantity} {item.variant?.size && `• Size: ${item.variant.size}`}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100">
                      {formatAmount(unitPrice * item.quantity)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Price Calculations */}
            <div className="space-y-2 text-xs pt-3 border-t border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100">{formatAmount(subtotal)}</span>
              </div>

              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Coupon Discount ({appliedCoupon?.code})</span>
                  <span>-{formatAmount(couponDiscount)}</span>
                </div>
              )}

              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-amber-700 dark:text-amber-400 font-semibold">
                  <span>Loyalty Points Discount</span>
                  <span>-{formatAmount(loyaltyDiscount)}</span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping ({shippingMethod})</span>
                <span>{shippingFee === 0 ? <strong className="text-emerald-700 dark:text-emerald-400">FREE</strong> : formatAmount(shippingFee)}</span>
              </div>

              {codFee > 0 && (
                <div className="flex justify-between text-stone-700 dark:text-stone-300">
                  <span>COD Handling Charge</span>
                  <span>+{formatAmount(codFee)}</span>
                </div>
              )}

              <div className="flex justify-between items-baseline text-base font-bold text-stone-900 dark:text-stone-100 pt-3 border-t border-stone-200 dark:border-stone-800">
                <span>Total Due</span>
                <span className="text-xl font-serif text-[#c46331]">{formatAmount(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* COD OTP Verification Modal */}
      {showCodOtpModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1c1a17] max-w-md w-full rounded-2xl border border-stone-200 dark:border-stone-800 shadow-2xl p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-[#c46331]" />
                <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">Verify Phone for Cash on Delivery</h3>
              </div>
              <button 
                onClick={() => setShowCodOtpModal(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
              To safeguard your order against return-to-origin fraud, please enter the 6-digit confirmation code sent to <strong className="text-stone-900 dark:text-stone-100">{address.phone}</strong>.
            </p>

            {/* Test Simulation Code Banner */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-900 dark:text-amber-300">
              <div className="flex items-center justify-between">
                <span>🔐 SMS Verification Code:</span>
                <span className="font-mono font-bold text-sm tracking-widest text-[#c46331]">{sentOtpCode}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Enter 6-Digit OTP</label>
              <input
                type="text"
                maxLength={6}
                placeholder="123456"
                value={codOtpInput}
                onChange={(e) => setCodOtpInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center tracking-[0.4em] font-mono text-lg font-bold py-3 border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl text-stone-900 dark:text-stone-100 focus:border-[#c46331] outline-none"
              />
            </div>

            {otpError && (
              <p className="text-xs text-rose-600 font-semibold">{otpError}</p>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="button"
                onClick={() => setShowCodOtpModal(false)}
                className="flex-1 py-2.5 border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 text-xs font-bold rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleVerifyCodOtp}
                disabled={codOtpInput.length !== 6 || isProcessing}
                className="flex-1 py-2.5 bg-[#c46331] hover:bg-[#a34c28] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md disabled:opacity-50 transition-all"
              >
                {isProcessing ? 'Verifying...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[60vh] flex items-center justify-center bg-[#fdfbf9] dark:bg-black">
        <div className="w-8 h-8 border-2 border-[#c46331] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <CheckoutPageContent />
    </Suspense>
  );
}
