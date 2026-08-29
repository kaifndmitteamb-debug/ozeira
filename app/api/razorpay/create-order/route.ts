import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { DataStore } from '@/lib/store/data-store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency = 'INR', receipt, notes } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid order amount' }, { status: 400 });
    }

    // Amount in paise
    const amountInPaise = Math.round(amount * 100);

    // Fetch Razorpay credentials from env or store_settings
    let keyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_ozeira_key';
    let keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (isSupabaseConfigured && !keySecret) {
      try {
        const { data: settsData } = await supabase
          .from('store_settings')
          .select('value')
          .eq('key', 'global_settings')
          .single();
        if (settsData?.value?.payments) {
          keyId = settsData.value.payments.razorpayKeyId || keyId;
          keySecret = settsData.value.payments.razorpayKeySecret || keySecret;
        }
      } catch (e) {
        console.warn('Could not load payment settings for Razorpay:', e);
      }
    }

    // If real keySecret exists, invoke real Razorpay REST API
    if (keySecret && keyId && !keyId.includes('rzp_test_ozeira_key')) {
      const authHeader = Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const res = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Basic ${authHeader}`,
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency,
          receipt: receipt || `rec_${Date.now()}`,
          notes: notes || {},
        }),
      });

      const razorpayOrder = await res.json();
      if (!res.ok) {
        console.error('Razorpay API error:', razorpayOrder);
        return NextResponse.json({ error: razorpayOrder.error?.description || 'Razorpay order creation failed' }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        key_id: keyId,
      });
    }

    // Fallback: Test Mode secure order reference
    const simulatedOrderId = `order_${crypto.randomBytes(10).toString('hex')}`;
    return NextResponse.json({
      success: true,
      order_id: simulatedOrderId,
      amount: amountInPaise,
      currency,
      key_id: keyId,
      simulated: true,
    });
  } catch (err: any) {
    console.error('Razorpay create order API error:', err);
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
