export type UserRole = 'admin' | 'order_manager' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  role: UserRole;
  loyalty_points: number;
  referral_code: string;
  referred_by?: string;
  is_blocked: boolean;
  cod_blocked?: boolean;
  cancelled_cod_orders_count?: number;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  sort_order: number;
  is_active: boolean;
  item_count?: number;
  subcategories?: Subcategory[];
}

export interface Subcategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string;
  sort_order: number;
  is_active: boolean;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size?: string;
  color?: string;
  color_hex?: string;
  sku: string;
  additional_price: number;
  stock_quantity: number;
  image_url?: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  title: string;
  slug: string;
  description: string;
  short_description: string;
  category_id: string;
  subcategory_id?: string;
  category_name?: string;
  brand: string;
  base_price: number;
  sale_price?: number;
  discount_percent: number;
  sku: string;
  total_stock: number;
  is_featured: boolean;
  is_trending: boolean;
  is_new: boolean;
  rating_avg: number;
  review_count: number;
  tags: string[];
  specifications: Record<string, string>;
  weight_grams: number;
  dimensions?: string;
  is_active: boolean;
  meta_title?: string;
  meta_description?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  created_at: string;
  updated_at: string;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string;
  button_text: string;
  button_url: string;
  image_url: string;
  background_color: string;
  badge_text?: string;
  sort_order: number;
  is_active: boolean;
  start_date?: string;
  end_date?: string;
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string;
  badge_text?: string;
  image_url: string;
  link_url: string;
  grid_type: 'half' | 'third' | 'full';
  sort_order: number;
  is_active: boolean;
}

export interface Announcement {
  id: string;
  text: string;
  link_url?: string;
  bg_color: string;
  text_color: string;
  is_active: boolean;
}

export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  address_type: 'home' | 'work' | 'other';
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  usage_limit?: number;
  usage_count: number;
  expires_at?: string;
  is_active: boolean;
}

export interface OfferCampaign {
  id: string;
  name: string;
  description: string;
  discount_type: 'percentage' | 'flat';
  discount_value: number;
  applies_to: 'all' | 'category' | 'products';
  target_ids: string[];
  start_date: string;
  end_date: string;
  is_active: boolean;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'return_requested'
  | 'returned'
  | 'refunded';

export type PaymentMethod = 'razorpay' | 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  product_title: string;
  variant_details?: {
    size?: string;
    color?: string;
    sku?: string;
  };
  quantity: number;
  unit_price: number;
  total_price: number;
  product_image: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  notes?: string;
  updated_by: string;
  created_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  user_name?: string;
  guest_email?: string;
  guest_phone?: string;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  coupon_id?: string;
  coupon_code?: string;
  loyalty_points_used: number;
  loyalty_discount_amount: number;
  shipping_fee: number;
  cod_fee: number;
  tax_amount: number;
  total_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  shipping_address: Address;
  items: OrderItem[];
  tracking_courier?: string;
  tracking_number?: string;
  tracking_url?: string;
  delivery_estimate?: string;
  customer_notes?: string;
  admin_notes?: string;
  status_history?: OrderStatusHistory[];
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  product_id: string;
  user_id?: string;
  user_name: string;
  user_avatar?: string;
  rating: number;
  title: string;
  comment: string;
  images: string[];
  status: 'pending' | 'approved' | 'rejected';
  is_verified_purchase: boolean;
  created_at: string;
}

export interface LoyaltyTransaction {
  id: string;
  user_id: string;
  order_id?: string;
  points: number;
  type:
    | 'earned_purchase'
    | 'earned_review'
    | 'earned_referral'
    | 'earned_signup'
    | 'redeemed_order'
    | 'manual_adjust'
    | 'expired';
  description: string;
  created_at: string;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referrer_name?: string;
  referee_id: string;
  referee_name?: string;
  referee_email?: string;
  referral_code: string;
  status: 'signed_up' | 'first_order_placed' | 'rewarded' | 'flagged';
  reward_points: number;
  created_at: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
}

export interface CMSPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  updated_at: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  created_at: string;
}

export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  rateAgainstINR: number; // 1 INR = rate
  isDefault: boolean;
  isEnabled: boolean;
}

export interface StoreSettings {
  general: {
    storeName: string;
    tagline: string;
    supportEmail: string;
    supportPhone: string;
    supportAddress: string;
    logoUrl: string;
    themeAccentColor: string;
    whatsappNumber: string;
    whatsappMessage: string;
  };
  currencies: CurrencyConfig[];
  shipping: {
    freeShippingThreshold: number;
    standardShippingFee: number;
    expressShippingFee: number;
    estimatedStandardDays: string;
    estimatedExpressDays: string;
  };
  cod: {
    isEnabled: boolean;
    handlingFee: number;
    eligiblePincodes: string[]; // e.g. ["110001", "400001", "560001", "*"]
  };
  tax: {
    isEnabled: boolean;
    percentage: number;
    gstinNumber: string;
    inclusiveInPrice: boolean;
  };
  loyalty: {
    isEnabled: boolean;
    pointsPerRupeeSpent: number; // e.g. 1 point per ₹10 spent = 0.1
    pointsToRupeeRate: number; // e.g. 100 points = ₹10 => 0.1
    minPointsToRedeem: number;
    maxOrderDiscountPercent: number; // max % of order value that can be paid via points
    signupBonusPoints: number;
    reviewBonusPoints: number;
    referralBonusPoints: number;
    expiryDays: number;
    isExpiryEnabled: boolean;
  };
  notifications: {
    smsEnabled: boolean;
    emailEnabled: boolean;
    pushEnabled: boolean;
    twilioAccountSid?: string;
    twilioAuthToken?: string;
    twilioPhoneNumber?: string;
    msg91AuthKey?: string;
    msg91SenderId?: string;
    eventTriggers: {
      orderPlaced: { sms: boolean; email: boolean; push: boolean };
      orderConfirmed: { sms: boolean; email: boolean; push: boolean };
      orderShipped: { sms: boolean; email: boolean; push: boolean };
      orderDelivered: { sms: boolean; email: boolean; push: boolean };
      backInStock: { sms: boolean; email: boolean; push: boolean };
      pointsExpiring: { sms: boolean; email: boolean; push: boolean };
      abandonedCart: { sms: boolean; email: boolean; push: boolean };
    };
  };
  payments: {
    razorpayKeyId: string;
    razorpayKeySecret: string;
    isTestMode: boolean;
  };
  business: {
    legalName?: string;
    tradeName?: string;
    gstin?: string;
    pan?: string;
    registeredAddress?: string;
    supportEmail?: string;
    supportPhone?: string;
  };
  abandonedCart: {
    isEnabled: boolean;
    firstDelayHours: number;
    secondDelayHours: number;
    reminderCouponCode?: string;
    maxReminders: number;
    emailSubject?: string;
  };
  codFraud: {
    requireOtp: boolean;
    maxCodAmount: number;
    blockedPincodes: string[];
    blockedPhones: string[];
  };
  analytics: {
    isEnabled: boolean;
    ga4MeasurementId?: string;
    metaPixelId?: string;
  };
  email?: {
    provider?: 'supabase' | 'gmail' | 'smtp' | 'resend';
    smtpHost?: string;
    smtpPort?: number;
    smtpUser?: string;
    smtpPass?: string;
    resendApiKey?: string;
    fromEmail?: string;
    fromName?: string;
  };
}

export interface CartItem {
  id: string;
  productId: string;
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
  quantity: number;
}

export interface ProductFilterState {
  categorySlug?: string;
  subcategorySlug?: string;
  searchQuery?: string;
  minPrice?: number;
  maxPrice?: number;
  sizes: string[];
  colors: string[];
  brands: string[];
  ratings: number[];
  inStockOnly: boolean;
  onSaleOnly: boolean;
  sortBy: 'price-asc' | 'price-desc' | 'newest' | 'rating' | 'popular';
}

export * from './supplier';

