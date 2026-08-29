import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { DataStore } from '@/lib/store/data-store';

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    // Validate webhook secret if configured
    if (webhookSecret && signature) {
      const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBody)
        .digest('hex');

      if (expectedSignature !== signature) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 400 });
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    console.log(`💳 [Razorpay Webhook] Received event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const payment = payload.payload?.payment?.entity;
      const orderId = payment?.order_id;
      const amount = payment?.amount ? payment.amount / 100 : 0;

      if (isSupabaseConfigured && orderId) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'paid',
            razorpay_payment_id: payment.id,
            status: 'confirmed',
          })
          .eq('razorpay_order_id', orderId);
      }
    } else if (event === 'payment.failed') {
      const payment = payload.payload?.payment?.entity;
      const orderId = payment?.order_id;

      if (isSupabaseConfigured && orderId) {
        await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
          })
          .eq('razorpay_order_id', orderId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Razorpay Webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
