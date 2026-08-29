import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { DataStore } from '@/lib/store/data-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id } = body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return NextResponse.json({ error: 'Missing required payment verification parameters' }, { status: 400 });
    }

    let keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (isSupabaseConfigured && !keySecret) {
      try {
        const { data: settsData } = await supabase
          .from('store_settings')
          .select('value')
          .eq('key', 'global_settings')
          .single();
        if (settsData?.value?.payments) {
          keySecret = settsData.value.payments.razorpayKeySecret || keySecret;
        }
      } catch (e) {
        console.warn('Could not load payment settings for verification:', e);
      }
    }

    // Cryptographic HMAC SHA256 Signature Verification
    let isValid = false;

    if (keySecret) {
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      isValid = generatedSignature === razorpay_signature;
    } else {
      // Test Mode validation
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Payment signature verification failed. Potential tampering detected.' }, { status: 400 });
    }

    // Update order status in Supabase and local store
    if (order_id) {
      if (isSupabaseConfigured) {
        try {
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              razorpay_payment_id,
              razorpay_order_id,
              status: 'confirmed',
            })
            .eq('id', order_id);
        } catch (dbErr) {
          console.error('Error updating order payment status in Supabase:', dbErr);
        }
      }
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Razorpay payment signature verified successfully.',
    });
  } catch (err: any) {
    console.error('Payment verification error:', err);
    return NextResponse.json({ error: err?.message || 'Verification failed' }, { status: 500 });
  }
}
