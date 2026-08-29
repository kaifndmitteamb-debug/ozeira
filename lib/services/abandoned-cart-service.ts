'use client';

import { supabase } from '@/lib/supabase/client';
import { CartItem } from '@/types';
import { DataStore } from '@/lib/store/data-store';
import { NotificationService } from './notification-service';

export interface AbandonedCartRecord {
  id: string;
  user_id?: string;
  email: string;
  phone?: string;
  cart_items: CartItem[];
  total_amount: number;
  recovery_token: string;
  reminders_sent: number;
  last_reminder_at?: string;
  is_recovered: boolean;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = 'ozeira_abandoned_carts_v1';

export const AbandonedCartService = {
  // Save or update an abandoned cart checkpoint
  async recordCartSession(
    email: string,
    cartItems: CartItem[],
    phone?: string,
    userId?: string
  ): Promise<string | null> {
    if (!email || !cartItems || cartItems.length === 0) return null;

    const settings = DataStore.getSettings();
    if (!settings.abandonedCart?.isEnabled) return null;

    const totalAmount = cartItems.reduce(
      (sum, item) =>
        sum +
        ((item.product.sale_price ?? item.product.base_price) + (item.variant?.additional_price || 0)) *
          item.quantity,
      0
    );

    const token = 'rec_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const cartId = 'ac-' + Date.now();

    const record: AbandonedCartRecord = {
      id: cartId,
      user_id: userId,
      email: email.trim().toLowerCase(),
      phone: phone?.trim(),
      cart_items: cartItems,
      total_amount: totalAmount,
      recovery_token: token,
      reminders_sent: 0,
      is_recovered: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Save locally
    try {
      const existing: AbandonedCartRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const filtered = existing.filter((c) => c.email !== record.email || c.is_recovered);
      filtered.push(record);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      // LocalStorage fallback
    }

    // Save to Supabase
    try {
      await supabase.from('abandoned_carts').upsert({
        id: record.id,
        user_id: record.user_id,
        email: record.email,
        phone: record.phone,
        cart_items: record.cart_items,
        total_amount: record.total_amount,
        recovery_token: record.recovery_token,
        reminders_sent: 0,
        is_recovered: false,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[AbandonedCart] Supabase save error:', err);
    }

    return token;
  },

  // Mark cart as recovered / completed when order is placed
  async markCartRecovered(email: string) {
    if (!email) return;
    const cleanEmail = email.trim().toLowerCase();

    try {
      const existing: AbandonedCartRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      const updated = existing.map((c) => (c.email === cleanEmail ? { ...c, is_recovered: true } : c));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {}

    try {
      await supabase
        .from('abandoned_carts')
        .update({ is_recovered: true, updated_at: new Date().toISOString() })
        .eq('email', cleanEmail);
    } catch (err) {
      console.warn('[AbandonedCart] Supabase mark recovered error:', err);
    }
  },

  // Get cart items from recovery token
  async getCartByToken(token: string): Promise<AbandonedCartRecord | null> {
    if (!token) return null;

    try {
      const { data, error } = await supabase
        .from('abandoned_carts')
        .select('*')
        .eq('recovery_token', token)
        .single();

      if (data && !error) return data as AbandonedCartRecord;
    } catch (err) {}

    // Fallback to local storage
    try {
      const existing: AbandonedCartRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return existing.find((c) => c.recovery_token === token) || null;
    } catch (e) {
      return null;
    }
  },

  // Send Abandoned Cart Reminder Email (Max 2 reminders, no spam)
  async dispatchReminder(cart: AbandonedCartRecord, reminderNumber: 1 | 2) {
    if (cart.is_recovered || cart.reminders_sent >= (DataStore.getSettings().abandonedCart?.maxReminders || 2)) {
      return false;
    }

    const settings = DataStore.getSettings();
    const couponCode = settings.abandonedCart?.reminderCouponCode || 'WELCOME10';
    const recoveryUrl = `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/checkout?recover_token=${cart.recovery_token}&coupon=${couponCode}`;

    const itemsHtml = cart.cart_items
      .map(
        (i) => {
          const unitPrice = (i.product.sale_price ?? i.product.base_price) + (i.variant?.additional_price || 0);
          return `
      <div style="display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid #f0eae1;">
        <img src="${i.product.images[0]?.image_url || ''}" width="50" height="50" style="border-radius:8px;object-fit:cover;" />
        <div style="flex:1;">
          <strong style="color:#1a1714;font-size:13px;">${i.product.title}</strong>
          <div style="font-size:12px;color:#786f66;">Qty: ${i.quantity} • ₹${unitPrice.toLocaleString('en-IN')}</div>
        </div>
      </div>
    `;
        }
      )
      .join('');

    const subject = reminderNumber === 1 
      ? (settings.abandonedCart?.emailSubject || 'Your curated pieces are waiting at Ozeira')
      : `Exclusive Invitation: Complete your order with 10% privilege discount [${couponCode}]`;

    const htmlContent = `
      <div style="font-family:'Playfair Display',Georgia,serif;max-width:600px;margin:0 auto;background:#fdfbf9;padding:32px;border:1px solid #e8e0d5;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="letter-spacing:4px;color:#1a1714;margin:0;font-size:24px;">O Z E I R A</h1>
          <p style="font-size:11px;letter-spacing:2px;color:#c46331;text-transform:uppercase;margin-top:4px;">Atelier Concierge</p>
        </div>
        <p style="color:#1a1714;font-size:15px;line-height:1.6;">
          ${reminderNumber === 1 ? 'We noticed you left some exquisite handcrafted pieces in your selection bag.' : 'Your reserved pieces remain held in our atelier. As a special courtesy, enjoy an exclusive privilege discount on us.'}
        </p>
        <div style="background:#ffffff;padding:16px;border-radius:12px;border:1px solid #f0eae1;margin:20px 0;">
          <h4 style="margin:0 0 12px;font-size:13px;color:#786f66;text-transform:uppercase;letter-spacing:1px;">Your Selected Atelier Pieces</h4>
          ${itemsHtml}
          <div style="text-align:right;margin-top:12px;font-size:14px;font-weight:bold;color:#1a1714;">
            Total: ₹${cart.total_amount.toLocaleString('en-IN')}
          </div>
        </div>
        ${couponCode ? `
          <div style="text-align:center;background:#fdf6f0;border:1px dashed #c46331;padding:12px;border-radius:8px;margin-bottom:20px;">
            <span style="font-size:12px;color:#786f66;">Use Code at Checkout:</span>
            <span style="display:block;font-size:16px;font-weight:bold;color:#c46331;letter-spacing:2px;">${couponCode}</span>
          </div>
        ` : ''}
        <div style="text-align:center;margin-top:28px;">
          <a href="${recoveryUrl}" style="background:#1a1714;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;font-size:13px;font-weight:bold;letter-spacing:1px;display:inline-block;">
            COMPLETE YOUR ORDER &rarr;
          </a>
        </div>
      </div>
    `;

    // Log notification
    await NotificationService.sendNotification({
      type: 'email',
      recipient: cart.email,
      subject: subject,
      message: `Your Ozeira bag with ${cart.cart_items.length} items is waiting. Complete order: ${recoveryUrl}`,
      metadata: { abandoned_cart_id: cart.id, recovery_token: cart.recovery_token, reminderNumber },
    });

    // Update reminder count
    const updatedCount = cart.reminders_sent + 1;
    try {
      await supabase
        .from('abandoned_carts')
        .update({
          reminders_sent: updatedCount,
          last_reminder_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', cart.id);
    } catch (e) {}

    return true;
  },
};
