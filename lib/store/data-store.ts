import {
  Product,
  Category,
  HeroBanner,
  PromoBanner,
  Announcement,
  Coupon,
  OfferCampaign,
  Order,
  Review,
  UserProfile,
  LoyaltyTransaction,
  Referral,
  CMSPage,
  ContactMessage,
  NewsletterSubscriber,
  StoreSettings,
  OrderStatus,
} from '@/types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CATEGORIES,
  INITIAL_HERO_BANNERS,
  INITIAL_PROMO_BANNERS,
  INITIAL_ANNOUNCEMENT,
  INITIAL_COUPONS,
  INITIAL_OFFERS,
  INITIAL_USERS,
  INITIAL_ORDERS,
  INITIAL_REVIEWS,
  INITIAL_LOYALTY_TRANSACTIONS,
  INITIAL_REFERRALS,
  INITIAL_CMS_PAGES,
  INITIAL_SETTINGS,
} from '@/lib/data/initial-data';
import { generateOrderNumber, generateReferralCode } from '@/lib/utils';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { NotificationService } from '@/lib/services/notification-service';

export interface RestockNotificationRequest {
  id: string;
  productId: string;
  variantId?: string;
  email: string;
  phone?: string;
  createdAt: string;
}

export interface NotificationLog {
  id: string;
  channel: 'sms' | 'email' | 'push';
  eventType: string;
  recipient: string;
  content: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'failed';
}

const STORAGE_KEYS = {
  PRODUCTS: 'ozeira_products_v1',
  CATEGORIES: 'ozeira_categories_v1',
  HERO_BANNERS: 'ozeira_hero_banners_v1',
  PROMO_BANNERS: 'ozeira_promo_banners_v1',
  ANNOUNCEMENT: 'ozeira_announcement_v1',
  COUPONS: 'ozeira_coupons_v1',
  OFFERS: 'ozeira_offers_v1',
  ORDERS: 'ozeira_orders_v1',
  USERS: 'ozeira_users_v1',
  REVIEWS: 'ozeira_reviews_v1',
  LOYALTY_LEDGER: 'ozeira_loyalty_ledger_v1',
  REFERRALS: 'ozeira_referrals_v1',
  CMS_PAGES: 'ozeira_cms_pages_v1',
  CONTACT_MSGS: 'ozeira_contact_msgs_v1',
  SUBSCRIBERS: 'ozeira_subscribers_v1',
  SETTINGS: 'ozeira_settings_v1',
  RESTOCK_NOTIFICATIONS: 'ozeira_restock_v1',
  NOTIFICATION_LOGS: 'ozeira_notif_logs_v1',
  DELETED_PRODUCTS: 'ozeira_deleted_products_v1',
};

export const DATASTORE_CHANGE_EVENT = 'ozeira_datastore_change';

function notifyDataChange(key: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(DATASTORE_CHANGE_EVENT, { detail: { key } }));
  }
}

// Safe localStorage helper
function getStored<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    console.error(`Error reading ${key} from storage`, e);
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
    notifyDataChange(key);
  } catch (e) {
    console.error(`Error writing ${key} to storage`, e);
  }
}

export class DataStore {
  // --- Deleted Products Registry ---
  static getDeletedProductIds(): string[] {
    return getStored<string[]>(STORAGE_KEYS.DELETED_PRODUCTS, []);
  }

  // --- Supabase Realtime & Remote Sync ---
  static async syncFromSupabase(): Promise<void> {
    if (!isSupabaseConfigured || typeof window === 'undefined') return;
    try {
      // 1. Sync Categories
      const { data: catData } = await supabase.from('categories').select('*, subcategories(*)').order('sort_order', { ascending: true });
      if (catData && catData.length > 0) {
        setStored(STORAGE_KEYS.CATEGORIES, catData);
      }

      // 2. Sync Products (Filter out any explicitly deleted product IDs)
      const { data: prodData } = await supabase.from('products').select('*, images:product_images(*), variants:product_variants(*)');
      if (prodData && prodData.length > 0) {
        const deleted = new Set(this.getDeletedProductIds());
        const activeProducts = prodData.filter((p: any) => !deleted.has(p.id));
        setStored(STORAGE_KEYS.PRODUCTS, activeProducts);
      }

      // 3. Sync Banners
      const { data: heroData } = await supabase.from('hero_banners').select('*').order('sort_order', { ascending: true });
      if (heroData && heroData.length > 0) {
        setStored(STORAGE_KEYS.HERO_BANNERS, heroData);
      }

      const { data: promoData } = await supabase.from('promo_banners').select('*').order('sort_order', { ascending: true });
      if (promoData && promoData.length > 0) {
        setStored(STORAGE_KEYS.PROMO_BANNERS, promoData);
      }

      // 4. Sync Announcements
      const { data: annData } = await supabase.from('announcements').select('*').limit(1);
      if (annData && annData.length > 0) {
        setStored(STORAGE_KEYS.ANNOUNCEMENT, annData[0]);
      }

      // 5. Sync Coupons & Offers
      const { data: coupData } = await supabase.from('coupons').select('*');
      if (coupData && coupData.length > 0) {
        setStored(STORAGE_KEYS.COUPONS, coupData);
      }

      const { data: offData } = await supabase.from('offers_campaigns').select('*');
      if (offData && offData.length > 0) {
        setStored(STORAGE_KEYS.OFFERS, offData);
      }

      // 6. Sync Orders
      const { data: ordData } = await supabase.from('orders').select('*, items:order_items(*), status_history:order_status_history(*)').order('created_at', { ascending: false });
      if (ordData && ordData.length > 0) {
        setStored(STORAGE_KEYS.ORDERS, ordData);
      }

      // 7. Sync Profiles
      const { data: profData } = await supabase.from('profiles').select('*');
      if (profData && profData.length > 0) {
        setStored(STORAGE_KEYS.USERS, profData);
      }

      // 8. Sync Reviews
      const { data: revData } = await supabase.from('reviews').select('*').order('created_at', { ascending: false });
      if (revData && revData.length > 0) {
        setStored(STORAGE_KEYS.REVIEWS, revData);
      }

      // 9. Sync CMS Pages
      const { data: cmsData } = await supabase.from('cms_pages').select('*');
      if (cmsData && cmsData.length > 0) {
        setStored(STORAGE_KEYS.CMS_PAGES, cmsData);
      }

      // 10. Sync Settings
      const { data: settsData } = await supabase.from('store_settings').select('*').eq('key', 'global_settings').single();
      if (settsData && settsData.value) {
        setStored(STORAGE_KEYS.SETTINGS, settsData.value);
      }
    } catch (err) {
      console.error('Error syncing from Supabase:', err);
    }
  }

  // --- Products ---
  static getProducts(): Product[] {
    const deleted = new Set(this.getDeletedProductIds());
    const stored = getStored<Product[]>(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    return stored.filter((p) => !deleted.has(p.id));
  }

  static getProductBySlug(slug: string): Product | undefined {
    const products = this.getProducts();
    return products.find((p) => p.slug === slug);
  }

  static getProductById(id: string): Product | undefined {
    const products = this.getProducts();
    return products.find((p) => p.id === id);
  }

  static saveProduct(product: Product): Product {
    // If this product ID was previously marked deleted, un-delete it
    const currentDeleted = this.getDeletedProductIds();
    if (currentDeleted.includes(product.id)) {
      setStored(
        STORAGE_KEYS.DELETED_PRODUCTS,
        currentDeleted.filter((dId) => dId !== product.id)
      );
    }

    const products = this.getProducts();
    const index = products.findIndex((p) => p.id === product.id);
    let updated: Product[];
    if (index >= 0) {
      updated = [...products];
      updated[index] = { ...product, updated_at: new Date().toISOString() };
    } else {
      updated = [{ ...product, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...products];
    }
    setStored(STORAGE_KEYS.PRODUCTS, updated);

    // Background Supabase Sync
    if (isSupabaseConfigured) {
      const { images, variants, ...prodFields } = product;
      supabase.from('products').upsert(prodFields).then(() => {
        if (images && images.length > 0) {
          supabase.from('product_images').upsert(images);
        }
        if (variants && variants.length > 0) {
          supabase.from('product_variants').upsert(variants);
        }
      });
    }

    return product;
  }

  static deleteProduct(id: string): void {
    // 1. Record ID in persistent deleted registry
    const currentDeleted = this.getDeletedProductIds();
    if (!currentDeleted.includes(id)) {
      setStored(STORAGE_KEYS.DELETED_PRODUCTS, [...currentDeleted, id]);
    }

    // 2. Filter from products array and store
    const products = this.getProducts().filter((p) => p.id !== id);
    setStored(STORAGE_KEYS.PRODUCTS, products);

    // 3. Supabase Cascading Deletion
    if (isSupabaseConfigured) {
      // First delete dependent children records to prevent foreign key errors
      Promise.all([
        supabase.from('product_images').delete().eq('product_id', id),
        supabase.from('product_variants').delete().eq('product_id', id),
        supabase.from('reviews').delete().eq('product_id', id),
      ]).then(() => {
        supabase.from('products').delete().eq('id', id).then(({ error }) => {
          if (error) console.error('Error deleting product from Supabase:', error);
        });
      });
    }
  }

  static decrementProductStock(items: { productId: string; variantId?: string; quantity: number }[]): void {
    const products = this.getProducts();
    for (const item of items) {
      const prod = products.find((p) => p.id === item.productId);
      if (prod) {
        prod.total_stock = Math.max(0, prod.total_stock - item.quantity);
        if (item.variantId && prod.variants) {
          const v = prod.variants.find((vr) => vr.id === item.variantId);
          if (v) {
            v.stock_quantity = Math.max(0, v.stock_quantity - item.quantity);
          }
        }
        if (isSupabaseConfigured) {
          supabase.from('products').update({ total_stock: prod.total_stock }).eq('id', prod.id);
        }
      }
    }
    setStored(STORAGE_KEYS.PRODUCTS, products);
  }

  // --- Categories ---
  static getCategories(): Category[] {
    return getStored<Category[]>(STORAGE_KEYS.CATEGORIES, INITIAL_CATEGORIES);
  }

  static saveCategory(category: Category): Category {
    const categories = this.getCategories();
    const idx = categories.findIndex((c) => c.id === category.id);
    let updated: Category[];
    if (idx >= 0) {
      updated = [...categories];
      updated[idx] = category;
    } else {
      updated = [...categories, category];
    }
    setStored(STORAGE_KEYS.CATEGORIES, updated);

    if (isSupabaseConfigured) {
      const { subcategories, ...catFields } = category;
      supabase.from('categories').upsert(catFields).then(() => {
        if (subcategories && subcategories.length > 0) {
          supabase.from('subcategories').upsert(subcategories);
        }
      });
    }

    return category;
  }

  static deleteCategory(id: string): void {
    const categories = this.getCategories().filter((c) => c.id !== id);
    setStored(STORAGE_KEYS.CATEGORIES, categories);

    if (isSupabaseConfigured) {
      supabase.from('categories').delete().eq('id', id);
    }
  }

  // --- CMS Banners & Announcements ---
  static getHeroBanners(): HeroBanner[] {
    return getStored<HeroBanner[]>(STORAGE_KEYS.HERO_BANNERS, INITIAL_HERO_BANNERS);
  }

  static saveHeroBanners(banners: HeroBanner[]): void {
    setStored(STORAGE_KEYS.HERO_BANNERS, banners);
  }

  static getPromoBanners(): PromoBanner[] {
    return getStored<PromoBanner[]>(STORAGE_KEYS.PROMO_BANNERS, INITIAL_PROMO_BANNERS);
  }

  static savePromoBanners(banners: PromoBanner[]): void {
    setStored(STORAGE_KEYS.PROMO_BANNERS, banners);
  }

  static getAnnouncement(): Announcement {
    return getStored<Announcement>(STORAGE_KEYS.ANNOUNCEMENT, INITIAL_ANNOUNCEMENT);
  }

  static saveAnnouncement(announcement: Announcement): void {
    setStored(STORAGE_KEYS.ANNOUNCEMENT, announcement);
  }

  // --- Orders ---
  static getOrders(): Order[] {
    return getStored<Order[]>(STORAGE_KEYS.ORDERS, INITIAL_ORDERS);
  }

  static getOrderById(id: string): Order | undefined {
    return this.getOrders().find((o) => o.id === id || o.order_number === id);
  }

  static createOrder(order: Partial<Order>): Order {
    const orders = this.getOrders();
    const newOrder: Order = {
      id: order.id || `ord-${Date.now()}`,
      order_number: order.order_number || generateOrderNumber(),
      user_id: order.user_id,
      user_name: order.user_name || order.shipping_address?.full_name || 'Valued Client',
      guest_email: order.guest_email,
      guest_phone: order.guest_phone,
      status: order.status || 'pending',
      subtotal: order.subtotal || 0,
      discount_amount: order.discount_amount || 0,
      coupon_id: order.coupon_id,
      coupon_code: order.coupon_code,
      loyalty_points_used: order.loyalty_points_used || 0,
      loyalty_discount_amount: order.loyalty_discount_amount || 0,
      shipping_fee: order.shipping_fee || 0,
      cod_fee: order.cod_fee || 0,
      tax_amount: order.tax_amount || 0,
      total_amount: order.total_amount || 0,
      payment_method: order.payment_method || 'razorpay',
      payment_status: order.payment_status || (order.payment_method === 'cod' ? 'pending' : 'paid'),
      razorpay_order_id: order.razorpay_order_id,
      razorpay_payment_id: order.razorpay_payment_id,
      shipping_address: order.shipping_address!,
      items: order.items || [],
      delivery_estimate: order.delivery_estimate || new Date(Date.now() + 4 * 86400000).toISOString().split('T')[0],
      customer_notes: order.customer_notes,
      admin_notes: order.admin_notes,
      status_history: [
        {
          id: `sh-${Date.now()}`,
          order_id: order.id || `ord-${Date.now()}`,
          status: order.status || 'pending',
          notes: 'Order placed successfully',
          updated_by: 'Customer',
          created_at: new Date().toISOString(),
        },
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Decrement stock
    this.decrementProductStock(
      newOrder.items.map((i) => ({ productId: i.product_id, variantId: i.variant_id, quantity: i.quantity }))
    );

    // Save order
    setStored(STORAGE_KEYS.ORDERS, [newOrder, ...orders]);

    // Background Supabase Sync
    if (isSupabaseConfigured) {
      const { items, status_history, ...orderFields } = newOrder;
      supabase.from('orders').upsert(orderFields).then(({ error }) => {
        if (error) console.error('Error inserting order to Supabase:', error);
        if (items && items.length > 0) {
          supabase.from('order_items').upsert(items.map(i => ({ ...i, order_id: newOrder.id }))).then(({ error: iErr }) => {
            if (iErr) console.error('Error inserting order items:', iErr);
          });
        }
        if (status_history && status_history.length > 0) {
          supabase.from('order_status_history').upsert(status_history);
        }
      });
    }

    // Handle Loyalty point deduction and earnings
    if (newOrder.user_id) {
      if (newOrder.loyalty_points_used > 0) {
        this.addLoyaltyTransaction({
          user_id: newOrder.user_id,
          order_id: newOrder.id,
          points: -newOrder.loyalty_points_used,
          type: 'redeemed_order',
          description: `Redeemed ${newOrder.loyalty_points_used} points for discount on ${newOrder.order_number}`,
        });
      }

      // Calculate points to earn (10% of total)
      const pointsToEarn = Math.floor(newOrder.total_amount * 0.1);
      if (pointsToEarn > 0) {
        this.addLoyaltyTransaction({
          user_id: newOrder.user_id,
          order_id: newOrder.id,
          points: pointsToEarn,
          type: 'earned_purchase',
          description: `Earned ${pointsToEarn} points on ${newOrder.order_number}`,
        });
      }
    }

    // Dispatch Order Confirmation Email & SMS
    NotificationService.notifyOrderStatus(newOrder, 'order_confirmed');

    return newOrder;
  }

  static async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    notes?: string,
    courier?: string,
    trackingNumber?: string,
    trackingUrl?: string
  ): Promise<{ order?: Order; notification?: any }> {
    const orders = this.getOrders();
    const order = orders.find((o) => o.id === orderId || o.order_number === orderId);
    if (!order) return { order: undefined };

    order.status = status;
    order.updated_at = new Date().toISOString();
    if (courier) order.tracking_courier = courier;
    if (trackingNumber) order.tracking_number = trackingNumber;
    if (trackingUrl) order.tracking_url = trackingUrl;

    if (status === 'delivered') {
      order.payment_status = 'paid';
      // If this was a referred user's first order, reward the referrer!
      if (order.user_id) {
        this.checkAndRewardReferral(order.user_id);
      }
    }

    if (!order.status_history) order.status_history = [];
    order.status_history.push({
      id: `sh-${Date.now()}`,
      order_id: order.id,
      status: status,
      notes: notes || `Status updated to ${status}`,
      updated_by: 'Staff Administrator',
      created_at: new Date().toISOString(),
    });

    setStored(STORAGE_KEYS.ORDERS, [...orders]);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('orders').update({
          status,
          tracking_courier: courier || order.tracking_courier,
          tracking_number: trackingNumber || order.tracking_number,
          tracking_url: trackingUrl || order.tracking_url,
          payment_status: order.payment_status,
          updated_at: order.updated_at,
        }).eq('id', order.id);

        await supabase.from('order_status_history').insert({
          id: `sh-${Date.now()}`,
          order_id: order.id,
          status,
          notes: notes || `Status updated to ${status}`,
          updated_by: 'Staff Administrator',
          created_at: new Date().toISOString(),
        });
      } catch (dbErr) {
        console.error('Error updating order in Supabase:', dbErr);
      }
    }

    // Send Automated Customer Notification
    const notification = await NotificationService.notifyOrderStatus(order, `order_${status}`, notes);

    return { order, notification };
  }

  // --- Users & Profiles ---
  static getUsers(): UserProfile[] {
    return getStored<UserProfile[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  static getUserById(id: string): UserProfile | undefined {
    return this.getUsers().find((u) => u.id === id);
  }

  static getUserByEmail(email: string): UserProfile | undefined {
    return this.getUsers().find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  static saveUser(user: UserProfile): UserProfile {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === user.id);
    let updated: UserProfile[];
    if (idx >= 0) {
      updated = [...users];
      updated[idx] = user;
    } else {
      updated = [user, ...users];
    }
    setStored(STORAGE_KEYS.USERS, updated);

    if (isSupabaseConfigured) {
      supabase.from('profiles').upsert(user);
    }

    return user;
  }

  static deleteUser(id: string): void {
    const users = this.getUsers().filter((u) => u.id !== id);
    setStored(STORAGE_KEYS.USERS, users);

    // Also remove guest orders if this was a guest customer
    if (id.startsWith('guest-')) {
      const email = id.replace('guest-', '').toLowerCase().trim();
      const orders = this.getOrders().filter(o => (o.guest_email || '').toLowerCase().trim() !== email);
      setStored(STORAGE_KEYS.ORDERS, orders);
      if (isSupabaseConfigured) {
        supabase.from('orders').delete().ilike('guest_email', email);
      }
    }

    if (isSupabaseConfigured && !id.startsWith('guest-')) {
      supabase.from('profiles').delete().eq('id', id).then(({ error }) => {
        if (error) console.error('Error deleting profile from Supabase:', error);
      });
    }
  }

  static createUser(user: Partial<UserProfile>, referralCodeUsed?: string): UserProfile {
    const newUser: UserProfile = {
      id: user.id || `user-${Date.now()}`,
      email: user.email!,
      full_name: user.full_name || 'Valued Patron',
      phone: user.phone,
      avatar_url: user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      role: user.role || 'customer',
      loyalty_points: 250, // Welcome bonus
      referral_code: user.referral_code || generateReferralCode(user.full_name || 'OZEIRA'),
      referred_by: undefined,
      is_blocked: false,
      created_at: new Date().toISOString(),
    };

    // Check referral code
    if (referralCodeUsed) {
      const allUsers = this.getUsers();
      const referrer = allUsers.find((u) => u.referral_code.toUpperCase() === referralCodeUsed.trim().toUpperCase());
      if (referrer && referrer.id !== newUser.id) {
        newUser.referred_by = referrer.id;
        // Record referral record
        this.addReferral({
          referrer_id: referrer.id,
          referrer_name: referrer.full_name,
          referee_id: newUser.id,
          referee_name: newUser.full_name,
          referee_email: newUser.email,
          referral_code: referralCodeUsed,
          status: 'signed_up',
          reward_points: 500,
        });
      }
    }

    this.saveUser(newUser);

    // Add Welcome loyalty transaction
    this.addLoyaltyTransaction({
      user_id: newUser.id,
      points: 250,
      type: 'earned_signup',
      description: 'Welcome Bonus for joining Ozeira Atelier',
    });

    return newUser;
  }

  // --- Loyalty & Referrals ---
  static getLoyaltyLedger(userId?: string): LoyaltyTransaction[] {
    const all = getStored<LoyaltyTransaction[]>(STORAGE_KEYS.LOYALTY_LEDGER, INITIAL_LOYALTY_TRANSACTIONS);
    if (userId) return all.filter((l) => l.user_id === userId);
    return all;
  }

  static addLoyaltyTransaction(tx: Omit<LoyaltyTransaction, 'id' | 'created_at'>): LoyaltyTransaction {
    const ledger = this.getLoyaltyLedger();
    const newTx: LoyaltyTransaction = {
      ...tx,
      id: `lt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      created_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.LOYALTY_LEDGER, [newTx, ...ledger]);

    // Update user balance
    const user = this.getUserById(tx.user_id);
    if (user) {
      user.loyalty_points = Math.max(0, user.loyalty_points + tx.points);
      this.saveUser(user);
    }

    return newTx;
  }

  static getReferrals(referrerId?: string): Referral[] {
    const all = getStored<Referral[]>(STORAGE_KEYS.REFERRALS, INITIAL_REFERRALS);
    if (referrerId) return all.filter((r) => r.referrer_id === referrerId);
    return all;
  }

  static addReferral(ref: Omit<Referral, 'id' | 'created_at'>): Referral {
    const all = this.getReferrals();
    const newRef: Referral = {
      ...ref,
      id: `ref-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.REFERRALS, [newRef, ...all]);
    return newRef;
  }

  static checkAndRewardReferral(refereeId: string): void {
    const referrals = this.getReferrals();
    const match = referrals.find((r) => r.referee_id === refereeId && r.status === 'signed_up');
    if (match) {
      match.status = 'rewarded';
      setStored(STORAGE_KEYS.REFERRALS, [...referrals]);

      // Reward referrer
      this.addLoyaltyTransaction({
        user_id: match.referrer_id,
        points: match.reward_points,
        type: 'earned_referral',
        description: `Referral Reward: ${match.referee_name || 'Friend'} completed their first delivered order!`,
      });

      // Reward referee too
      this.addLoyaltyTransaction({
        user_id: refereeId,
        points: 250,
        type: 'earned_referral',
        description: `Welcome Order Reward: First purchase delivered successfully!`,
      });
    }
  }

  // --- Coupons & Offers ---
  static getCoupons(): Coupon[] {
    return getStored<Coupon[]>(STORAGE_KEYS.COUPONS, INITIAL_COUPONS);
  }

  static saveCoupon(coupon: Coupon): Coupon {
    const coupons = this.getCoupons();
    const idx = coupons.findIndex((c) => c.id === coupon.id);
    let updated: Coupon[];
    if (idx >= 0) {
      updated = [...coupons];
      updated[idx] = coupon;
    } else {
      updated = [coupon, ...coupons];
    }
    setStored(STORAGE_KEYS.COUPONS, updated);
    return coupon;
  }

  static deleteCoupon(id: string): void {
    const coupons = this.getCoupons().filter((c) => c.id !== id);
    setStored(STORAGE_KEYS.COUPONS, coupons);
  }

  static validateCoupon(code: string, subtotal: number): { valid: boolean; discount: number; message: string; coupon?: Coupon } {
    const coupons = this.getCoupons();
    const coupon = coupons.find((c) => c.code.toUpperCase() === code.trim().toUpperCase() && c.is_active);
    if (!coupon) {
      return { valid: false, discount: 0, message: 'Invalid or expired promotional voucher code.' };
    }
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return { valid: false, discount: 0, message: 'This coupon code has expired.' };
    }
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return { valid: false, discount: 0, message: 'This coupon code has reached maximum usage limit.' };
    }
    if (subtotal < coupon.min_order_amount) {
      return {
        valid: false,
        discount: 0,
        message: `Minimum order amount of ₹${coupon.min_order_amount.toLocaleString()} required for this coupon.`,
      };
    }

    let discount = 0;
    if (coupon.discount_type === 'percentage') {
      discount = (subtotal * coupon.discount_value) / 100;
      if (coupon.max_discount_amount) {
        discount = Math.min(discount, coupon.max_discount_amount);
      }
    } else {
      discount = coupon.discount_value;
    }

    return {
      valid: true,
      discount: Math.min(discount, subtotal),
      message: `Coupon "${coupon.code}" applied successfully!`,
      coupon,
    };
  }

  static getOffers(): OfferCampaign[] {
    return getStored<OfferCampaign[]>(STORAGE_KEYS.OFFERS, INITIAL_OFFERS);
  }

  static saveOffer(offer: OfferCampaign): OfferCampaign {
    const offers = this.getOffers();
    const idx = offers.findIndex((o) => o.id === offer.id);
    let updated: OfferCampaign[];
    if (idx >= 0) {
      updated = [...offers];
      updated[idx] = offer;
    } else {
      updated = [offer, ...offers];
    }
    setStored(STORAGE_KEYS.OFFERS, updated);
    return offer;
  }

  // --- Reviews ---
  static getReviews(productId?: string): Review[] {
    const all = getStored<Review[]>(STORAGE_KEYS.REVIEWS, INITIAL_REVIEWS);
    if (productId) return all.filter((r) => r.product_id === productId);
    return all;
  }

  static addReview(review: Omit<Review, 'id' | 'created_at' | 'status'>): Review {
    const reviews = this.getReviews();
    const newRev: Review = {
      ...review,
      id: `rev-${Date.now()}`,
      status: 'approved', // Auto-approved for instant satisfaction, manageable in admin
      created_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.REVIEWS, [newRev, ...reviews]);

    // Recalculate product rating
    const productReviews = this.getReviews(review.product_id);
    const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
    const prod = this.getProductById(review.product_id);
    if (prod) {
      prod.rating_avg = Number(avg.toFixed(2));
      prod.review_count = productReviews.length;
      this.saveProduct(prod);
    }

    // Award loyalty review bonus if logged in user
    if (review.user_id) {
      this.addLoyaltyTransaction({
        user_id: review.user_id,
        points: 100,
        type: 'earned_review',
        description: `Verified Review Bonus for "${prod?.title || 'Product'}"`,
      });
    }

    return newRev;
  }

  static updateReviewStatus(reviewId: string, status: 'approved' | 'rejected'): void {
    const reviews = this.getReviews();
    const rev = reviews.find((r) => r.id === reviewId);
    if (rev) {
      rev.status = status;
      setStored(STORAGE_KEYS.REVIEWS, [...reviews]);
    }
  }

  static deleteReview(reviewId: string): void {
    const reviews = this.getReviews().filter((r) => r.id !== reviewId);
    setStored(STORAGE_KEYS.REVIEWS, reviews);
  }

  // --- CMS Pages ---
  static getCMSPages(): CMSPage[] {
    return getStored<CMSPage[]>(STORAGE_KEYS.CMS_PAGES, INITIAL_CMS_PAGES);
  }

  static getCMSPageBySlug(slug: string): CMSPage | undefined {
    return this.getCMSPages().find((p) => p.slug === slug);
  }

  static saveCMSPage(page: CMSPage): CMSPage {
    const pages = this.getCMSPages();
    const idx = pages.findIndex((p) => p.id === page.id || p.slug === page.slug);
    let updated: CMSPage[];
    if (idx >= 0) {
      updated = [...pages];
      updated[idx] = { ...page, updated_at: new Date().toISOString() };
    } else {
      updated = [...pages, { ...page, updated_at: new Date().toISOString() }];
    }
    setStored(STORAGE_KEYS.CMS_PAGES, updated);
    return page;
  }

  // --- Contact Messages & Subscribers ---
  static getContactMessages(): ContactMessage[] {
    return getStored<ContactMessage[]>(STORAGE_KEYS.CONTACT_MSGS, []);
  }

  static addContactMessage(msg: Omit<ContactMessage, 'id' | 'created_at' | 'status'>): ContactMessage {
    const msgs = this.getContactMessages();
    const newMsg: ContactMessage = {
      ...msg,
      id: `msg-${Date.now()}`,
      status: 'new',
      created_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.CONTACT_MSGS, [newMsg, ...msgs]);
    return newMsg;
  }

  static getSubscribers(): NewsletterSubscriber[] {
    return getStored<NewsletterSubscriber[]>(STORAGE_KEYS.SUBSCRIBERS, [
      { id: 'sub-1', email: 'patron@example.com', is_active: true, subscribed_at: '2026-04-10T10:00:00Z' },
      { id: 'sub-2', email: 'collector.luxe@domain.com', is_active: true, subscribed_at: '2026-05-18T14:30:00Z' },
    ]);
  }

  static addSubscriber(email: string): boolean {
    const subs = this.getSubscribers();
    if (subs.some((s) => s.email.toLowerCase() === email.toLowerCase())) return false;
    const newSub: NewsletterSubscriber = {
      id: `sub-${Date.now()}`,
      email: email.trim().toLowerCase(),
      is_active: true,
      subscribed_at: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.SUBSCRIBERS, [newSub, ...subs]);
    return true;
  }

  // --- Restock Notify Requests ---
  static getRestockRequests(): RestockNotificationRequest[] {
    return getStored<RestockNotificationRequest[]>(STORAGE_KEYS.RESTOCK_NOTIFICATIONS, []);
  }

  static addRestockRequest(req: Omit<RestockNotificationRequest, 'id' | 'createdAt'>): RestockNotificationRequest {
    const reqs = this.getRestockRequests();
    const newReq: RestockNotificationRequest = {
      ...req,
      id: `restock-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.RESTOCK_NOTIFICATIONS, [newReq, ...reqs]);
    return newReq;
  }

  // --- Notification Logs ---
  static getNotificationLogs(): NotificationLog[] {
    return getStored<NotificationLog[]>(STORAGE_KEYS.NOTIFICATION_LOGS, []);
  }

  static logNotification(log: Omit<NotificationLog, 'id' | 'timestamp'>): NotificationLog {
    const logs = this.getNotificationLogs();
    const newLog: NotificationLog = {
      ...log,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
    };
    setStored(STORAGE_KEYS.NOTIFICATION_LOGS, [newLog, ...logs.slice(0, 99)]);
    return newLog;
  }

  // --- Store Settings ---
  static getSettings(): StoreSettings {
    return getStored<StoreSettings>(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  static saveSettings(settings: StoreSettings): StoreSettings {
    setStored(STORAGE_KEYS.SETTINGS, settings);
    if (isSupabaseConfigured) {
      supabase.from('store_settings').upsert({
        key: 'global_settings',
        value: settings,
        updated_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) console.error('Error saving settings to Supabase:', error);
      });
    }
    return settings;
  }
}
