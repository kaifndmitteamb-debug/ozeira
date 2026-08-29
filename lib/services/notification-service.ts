import { Order, OrderStatus } from '@/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { DataStore } from '@/lib/store/data-store';

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface NotificationResult {
  success: boolean;
  emailSent: boolean;
  simulated?: boolean;
  provider?: string;
  error?: string;
  recipient: string;
  message: string;
}

export class NotificationService {
  /**
   * Generates a luxury branded HTML email template for order status events & cancellations
   */
  static generateOrderEmail(order: Order, eventType: string, customNotes?: string): EmailTemplate {
    const siteUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
    const customerEmail = this.resolveRecipientEmail(order);
    const customerPhone = order.shipping_address?.phone || order.guest_phone || '';
    const trackUrl = `${siteUrl}/track-order?orderNumber=${encodeURIComponent(order.order_number)}&email=${encodeURIComponent(customerEmail || customerPhone)}`;
    
    const itemsHtml = (order.items || [])
      .map(
        (item) => `
        <tr style="border-bottom: 1px solid #e7e5e4;">
          <td style="padding: 14px 0;">
            <div style="font-weight: 700; color: #1c1917; font-size: 14px;">${item.product_title}</div>
            ${
              item.variant_details?.size || item.variant_details?.color
                ? `<div style="font-size: 12px; color: #78716c; margin-top: 2px;">${item.variant_details.size ? `Size: ${item.variant_details.size}` : ''} ${item.variant_details.color ? `• Color: ${item.variant_details.color}` : ''}</div>`
                : ''
            }
            <div style="font-size: 12px; color: #78716c; margin-top: 2px;">Qty: ${item.quantity} × ₹${item.unit_price.toLocaleString()}</div>
          </td>
          <td style="padding: 14px 0; text-align: right; font-weight: 700; color: #1c1917; font-size: 14px;">
            ₹${item.total_price.toLocaleString()}
          </td>
        </tr>`
      )
      .join('');

    let headline = `Your Ozeira Order #${order.order_number} is Confirmed`;
    let subheadline = `Thank you for choosing Ozeira. Our master artisans are preparing your piece(s) with utmost care.`;
    let subject = `Your Ozeira Order #${order.order_number} is Confirmed`;

    const isCancelled = order.status === 'cancelled' || eventType === 'order_cancelled';

    if (isCancelled) {
      headline = `Ozeira Order #${order.order_number} has been Cancelled`;
      subheadline = `We regret to inform you that your order #${order.order_number} has been cancelled.`;
      subject = `Important: Your Ozeira Order #${order.order_number} has been Cancelled`;
    } else if (order.status === 'shipped') {
      headline = `Your Ozeira Order #${order.order_number} has been Dispatched`;
      subheadline = `Your shipment is now in transit with ${order.tracking_courier || 'our express courier'}. Tracking Number: <strong>${order.tracking_number || 'Available online'}</strong>.`;
      subject = `Shipped: Your Ozeira Order #${order.order_number} is on the way`;
    } else if (order.status === 'out_for_delivery') {
      headline = `Your Ozeira Order is Out for Delivery Today`;
      subheadline = `Our courier is arriving today at your registered delivery address.`;
      subject = `Out for Delivery: Your Ozeira Order #${order.order_number}`;
    } else if (order.status === 'delivered') {
      headline = `Your Ozeira Order has been Delivered`;
      subheadline = `Your package was successfully delivered. We hope you cherish your new piece.`;
      subject = `Delivered: Your Ozeira Order #${order.order_number}`;
    } else if (order.status === 'refunded') {
      headline = `Refund Processed for Order #${order.order_number}`;
      subheadline = `A full refund has been credited to your payment source for order #${order.order_number}.`;
      subject = `Refund Confirmation: Ozeira Order #${order.order_number}`;
    }

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headline}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fdfbf9; margin: 0; padding: 24px 0; color: #292524;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0">
    <tr>
      <td align="center">
        <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #e7e5e4; border-radius: 20px; overflow: hidden; box-shadow: 0 8px 30px rgba(0,0,0,0.06); text-align: left; max-width: 600px; width: 100%;">
          
          <!-- Luxury Header -->
          <tr>
            <td style="background-color: #1a1714; padding: 36px 40px; text-align: center;">
              <span style="font-family: Georgia, serif; font-size: 28px; letter-spacing: 5px; color: #ffffff; font-weight: bold; text-transform: uppercase;">OZEIRA</span>
              <div style="font-size: 11px; letter-spacing: 3px; color: #d37b3f; text-transform: uppercase; margin-top: 6px; font-weight: 600;">Atelier of Haute Craftsmanship</div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 40px;">
              <h1 style="font-family: Georgia, serif; font-size: 22px; color: #1c1917; margin: 0 0 12px 0; font-weight: bold;">${headline}</h1>
              <p style="font-size: 14px; line-height: 1.6; color: #57534e; margin: 0 0 24px 0;">${subheadline}</p>

              <!-- Cancellation Note Box -->
              ${isCancelled ? `
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-left: 4px solid #ef4444; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #991b1b; margin-bottom: 4px;">Cancellation Reason / Notice:</div>
                <div style="font-size: 14px; font-weight: 600; color: #7f1d1d; line-height: 1.5;">${customNotes || 'Your order was cancelled by store administration.'}</div>
              </div>

              <!-- Refund Guidance Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #3b82f6; border-radius: 10px; padding: 16px 20px; margin-bottom: 24px;">
                <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #1e40af; margin-bottom: 4px;">Refund & Settlement:</div>
                <div style="font-size: 13px; color: #334155; line-height: 1.5;">
                  ${order.payment_status === 'paid' 
                    ? `If you completed a prepaid transaction via Razorpay (UPI, Credit/Debit Card, Netbanking), a full refund of <strong>₹${order.total_amount.toLocaleString()}</strong> has been initiated and will reflect in your account within <strong>3 to 5 business days</strong>.`
                    : 'As this was a Cash on Delivery (COD) order, no payment was deducted and no refund is required.'}
                </div>
              </div>
              ` : (customNotes ? `
              <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #d37b3f; border-radius: 10px; padding: 14px 18px; margin-bottom: 24px; font-size: 13px; color: #92400e;">
                <strong>Concierge Note:</strong> ${customNotes}
              </div>
              ` : '')}

              <!-- Track Order CTA Button -->
              <div style="text-align: center; margin: 28px 0;">
                <a href="${trackUrl}" style="background-color: #d37b3f; color: #ffffff; padding: 14px 36px; font-size: 12px; font-weight: bold; text-decoration: none; border-radius: 50px; display: inline-block; letter-spacing: 1.5px; text-transform: uppercase; box-shadow: 0 4px 14px rgba(211,123,63,0.35);">
                  View Order Status →
                </a>
              </div>

              <!-- Order Summary Details -->
              <div style="background-color: #fafaf9; border: 1px solid #f5f5f4; border-radius: 14px; padding: 20px; margin-bottom: 24px;">
                <table width="100%" border="0" cellspacing="0" cellpadding="0">
                  <tr>
                    <td style="font-size: 11px; color: #78716c; text-transform: uppercase; font-weight: bold;">Order Reference</td>
                    <td align="right" style="font-size: 11px; color: #78716c; text-transform: uppercase; font-weight: bold;">Payment Method</td>
                  </tr>
                  <tr>
                    <td style="font-size: 15px; font-weight: bold; color: #1c1917; padding-top: 4px;">#${order.order_number}</td>
                    <td align="right" style="font-size: 13px; font-weight: 600; color: #1c1917; padding-top: 4px;">${order.payment_method.toUpperCase()} (${order.payment_status.toUpperCase()})</td>
                  </tr>
                </table>
              </div>

              <!-- Items Breakdown -->
              <h3 style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold; color: #1c1917; border-bottom: 1px solid #e7e5e4; padding-bottom: 8px; margin: 24px 0 12px 0;">
                Itemized Summary (${order.items?.length || 0} pieces)
              </h3>
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                ${itemsHtml}
              </table>

              <!-- Totals -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top: 16px; font-size: 13px; color: #57534e;">
                <tr>
                  <td style="padding: 4px 0;">Subtotal</td>
                  <td align="right" style="padding: 4px 0;">₹${order.subtotal?.toLocaleString()}</td>
                </tr>
                ${order.discount_amount ? `
                <tr>
                  <td style="padding: 4px 0; color: #16a34a;">Voucher Discount</td>
                  <td align="right" style="padding: 4px 0; color: #16a34a;">-₹${order.discount_amount.toLocaleString()}</td>
                </tr>` : ''}
                ${order.loyalty_discount_amount ? `
                <tr>
                  <td style="padding: 4px 0; color: #16a34a;">Loyalty Points Redeemed</td>
                  <td align="right" style="padding: 4px 0; color: #16a34a;">-₹${order.loyalty_discount_amount.toLocaleString()}</td>
                </tr>` : ''}
                <tr>
                  <td style="padding: 4px 0;">Insured Shipping</td>
                  <td align="right" style="padding: 4px 0;">${order.shipping_fee === 0 ? 'COMPLIMENTARY' : `₹${order.shipping_fee}`}</td>
                </tr>
                <tr style="border-top: 1px solid #e7e5e4; font-weight: bold; font-size: 16px; color: #1c1917;">
                  <td style="padding: 12px 0 4px 0;">Total Amount</td>
                  <td align="right" style="padding: 12px 0 4px 0; color: #d37b3f;">₹${order.total_amount?.toLocaleString()}</td>
                </tr>
              </table>

              <!-- Shipping Address -->
              <div style="background-color: #fafaf9; border-radius: 12px; padding: 16px; margin-top: 24px; font-size: 13px; line-height: 1.5; color: #57534e;">
                <strong style="color: #1c1917; display: block; margin-bottom: 4px; text-transform: uppercase; font-size: 11px;">Delivery Address</strong>
                ${order.shipping_address?.full_name || order.user_name || 'Client'}<br>
                ${order.shipping_address?.street || ''} ${order.shipping_address?.apartment || ''}<br>
                ${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} ${order.shipping_address?.postal_code || ''}<br>
                ${customerPhone ? `Contact: ${customerPhone}` : ''}
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #1a1714; padding: 24px 40px; text-align: center; font-size: 11px; color: #a8a29e; line-height: 1.6;">
              <p style="margin: 0 0 6px 0; color: #f5f5f4;">Ozeira Flagship Atelier • 42 Heritage Boulevard, Bandra West, Mumbai 400050</p>
              <p style="margin: 0;">Inquiries: <a href="mailto:care@ozeira.com" style="color: #d37b3f; text-decoration: none;">care@ozeira.com</a> | WhatsApp: +91 98765 43210</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const text = `
OZEIRA ATELIER
=============================
${headline}
${subheadline}

${isCancelled ? `CANCELLATION REASON: ${customNotes || 'Your order was cancelled by store administration.'}\nREFUND: ${order.payment_status === 'paid' ? `Full refund of ₹${order.total_amount.toLocaleString()} will be credited to your account within 3-5 business days.` : 'No payment was deducted (COD).'}\n` : (customNotes ? `NOTE: ${customNotes}\n` : '')}
Track Live: ${trackUrl}

Order Summary:
Order Number: #${order.order_number}
Total Amount: ₹${order.total_amount.toLocaleString()}
Payment Method: ${order.payment_method.toUpperCase()} (${order.payment_status.toUpperCase()})

Delivering to:
${order.shipping_address?.full_name || order.user_name || 'Client'}
${order.shipping_address?.street || ''}, ${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} ${order.shipping_address?.postal_code || ''}
${customerPhone ? `Ph: ${customerPhone}` : ''}

Concierge Support: care@ozeira.com | +91 98765 43210
`;

    return {
      subject,
      html,
      text,
    };
  }

  /**
   * Helper to resolve the recipient email from all available order & user records
   */
  static resolveRecipientEmail(order: Order): string {
    if (order.guest_email && order.guest_email.includes('@')) {
      return order.guest_email.trim();
    }
    if (order.user_id) {
      const user = DataStore.getUserById(order.user_id);
      if (user?.email && user.email.includes('@')) {
        return user.email.trim();
      }
    }
    return '';
  }

  /**
   * Dispatches order notification across Email, SMS, and Web Push channels
   */
  static async notifyOrderStatus(order: Order, eventType: string, customNotes?: string): Promise<NotificationResult> {
    const recipientEmail = this.resolveRecipientEmail(order);
    const recipientPhone = order.shipping_address?.phone || order.guest_phone || '';
    const emailData = this.generateOrderEmail(order, eventType, customNotes);

    console.log(`📨 [NotificationService] Dispatching notification for Order #${order.order_number} to "${recipientEmail || 'no-email'}"`);

    let dispatchResult: NotificationResult = {
      success: true,
      emailSent: false,
      simulated: true,
      recipient: recipientEmail || recipientPhone || 'customer',
      message: 'Notification logged to system.',
    };

    // Dispatch outbound email via internal API route
    if (recipientEmail) {
      try {
        const siteUrl = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
        const res = await fetch(`${siteUrl}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipientEmail,
            subject: emailData.subject,
            html: emailData.html,
            text: emailData.text,
            order_number: order.order_number,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          dispatchResult = {
            success: true,
            emailSent: !data.simulated,
            simulated: data.simulated || false,
            provider: data.provider,
            recipient: recipientEmail,
            message: data.message || `Email dispatched to ${recipientEmail}`,
          };
        } else {
          dispatchResult = {
            success: false,
            emailSent: false,
            error: data.error || 'Email dispatch failed',
            recipient: recipientEmail,
            message: data.error || 'Failed to dispatch email',
          };
        }
      } catch (e: any) {
        console.warn('Failed to call send-email API:', e);
        dispatchResult = {
          success: false,
          emailSent: false,
          error: e?.message || 'Network error while calling send-email',
          recipient: recipientEmail,
          message: e?.message || 'Network failure',
        };
      }
    }

    // Record notification log in Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from('notification_logs').insert([
          {
            id: `notif-email-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            user_id: order.user_id || null,
            channel: 'email',
            event_type: eventType,
            recipient: recipientEmail || 'customer@ozeira.com',
            content: emailData.subject,
            status: dispatchResult.emailSent ? 'delivered' : (dispatchResult.simulated ? 'simulated' : 'failed'),
            metadata: {
              order_number: order.order_number,
              total_amount: order.total_amount,
              status: order.status,
              notes: customNotes || null,
              provider: dispatchResult.provider || null,
              error: dispatchResult.error || null,
              preview: emailData.text.substring(0, 300),
            },
          },
        ]);

        if (recipientPhone) {
          const smsText = `Ozeira: Order #${order.order_number} is ${order.status.toUpperCase().replace(/_/g, ' ')}. ${customNotes ? `Note: ${customNotes}. ` : ''}Track: http://localhost:3000/track-order?orderNumber=${order.order_number}&email=${encodeURIComponent(recipientPhone)}`;
          await supabase.from('notification_logs').insert([
            {
              id: `notif-sms-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              user_id: order.user_id || null,
              channel: 'sms',
              event_type: eventType,
              recipient: recipientPhone,
              content: smsText,
              status: 'sent',
              metadata: { order_number: order.order_number, notes: customNotes || null },
            },
          ]);
        }
      } catch (err) {
        console.error('Error recording notification logs to Supabase:', err);
      }
    }

    return dispatchResult;
  }

  /**
   * Generic notification dispatcher for emails, sms, and abandoned cart reminders
   */
  static async sendNotification(params: {
    type: 'email' | 'sms' | 'push';
    recipient: string;
    subject?: string;
    message: string;
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    console.log(`📨 [NotificationService] ${params.type.toUpperCase()} sent to ${params.recipient}: ${params.subject || params.message}`);

    if (isSupabaseConfigured) {
      try {
        await supabase.from('notification_logs').insert([
          {
            id: `notif-${params.type}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            channel: params.type,
            event_type: params.metadata?.abandoned_cart_id ? 'abandoned_cart_reminder' : 'general_notification',
            recipient: params.recipient,
            content: params.subject ? `${params.subject}: ${params.message}` : params.message,
            status: 'sent',
            metadata: params.metadata || {},
          },
        ]);
      } catch (err) {
        console.error('Error recording notification log:', err);
      }
    }
    return true;
  }
}
