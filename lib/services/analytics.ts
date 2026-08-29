'use client';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export const AnalyticsService = {
  // Safe track event
  trackEvent(eventName: string, params: Record<string, any> = {}) {
    if (typeof window === 'undefined') return;

    try {
      // Google Analytics 4
      if (typeof window.gtag === 'function') {
        window.gtag('event', eventName, params);
      }

      // Meta (Facebook) Pixel
      if (typeof window.fbq === 'function') {
        // Map standard GA4 events to Meta Pixel equivalents
        const metaEventMap: Record<string, string> = {
          page_view: 'PageView',
          view_item: 'ViewContent',
          add_to_cart: 'AddToCart',
          begin_checkout: 'InitiateCheckout',
          purchase: 'Purchase',
          search: 'Search',
          add_to_wishlist: 'AddToWishlist',
        };

        const metaEvent = metaEventMap[eventName] || 'CustomEvent';
        if (metaEvent === 'CustomEvent') {
          window.fbq('trackCustom', eventName, params);
        } else {
          window.fbq('track', metaEvent, {
            content_name: params.item_name || params.content_name,
            content_ids: params.items?.map((i: any) => i.item_id) || (params.content_id ? [params.content_id] : []),
            value: params.value,
            currency: params.currency || 'INR',
            num_items: params.items?.length || 1,
          });
        }
      }
    } catch (err) {
      console.warn('[Analytics] Tracker error (safe ignored):', err);
    }
  },

  trackPageView(url: string, title?: string) {
    this.trackEvent('page_view', {
      page_location: url,
      page_title: title || (typeof document !== 'undefined' ? document.title : ''),
    });
  },

  trackViewItem(item: { id: string; name: string; price: number; category?: string }) {
    this.trackEvent('view_item', {
      currency: 'INR',
      value: item.price,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          price: item.price,
          quantity: 1,
        },
      ],
    });
  },

  trackAddToCart(item: { id: string; name: string; price: number; quantity: number; category?: string }) {
    this.trackEvent('add_to_cart', {
      currency: 'INR',
      value: item.price * item.quantity,
      items: [
        {
          item_id: item.id,
          item_name: item.name,
          item_category: item.category,
          price: item.price,
          quantity: item.quantity,
        },
      ],
    });
  },

  trackBeginCheckout(items: Array<{ id: string; name: string; price: number; quantity: number }>, totalValue: number) {
    this.trackEvent('begin_checkout', {
      currency: 'INR',
      value: totalValue,
      items: items.map((i) => ({
        item_id: i.id,
        item_name: i.name,
        price: i.price,
        quantity: i.quantity,
      })),
    });
  },

  trackPurchase(order: { id: string; orderNumber: string; totalAmount: number; items: any[] }) {
    this.trackEvent('purchase', {
      transaction_id: order.orderNumber || order.id,
      value: order.totalAmount,
      currency: 'INR',
      items: order.items.map((i: any) => ({
        item_id: i.product_id || i.id,
        item_name: i.product_title || i.name,
        price: i.unit_price || i.price,
        quantity: i.quantity,
      })),
    });
  },
};
