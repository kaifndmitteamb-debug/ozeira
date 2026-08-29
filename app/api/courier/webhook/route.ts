import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { DataStore } from '@/lib/store/data-store';
import { OrderStatus } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { awb, courier, current_status, event_time, location, order_id, order_number } = body;

    console.log(`🚚 [Courier Webhook] Received tracking update for AWB: ${awb} - Status: ${current_status}`);

    // Map carrier status string to internal OrderStatus
    let targetStatus: OrderStatus | undefined;
    const lowerStatus = (current_status || '').toLowerCase();

    if (lowerStatus.includes('out for delivery') || lowerStatus.includes('out_for_delivery')) {
      targetStatus = 'out_for_delivery';
    } else if (lowerStatus.includes('delivered') || lowerStatus.includes('completed')) {
      targetStatus = 'delivered';
    } else if (lowerStatus.includes('in transit') || lowerStatus.includes('shipped') || lowerStatus.includes('dispatched')) {
      targetStatus = 'shipped';
    }

    if (targetStatus && (order_id || order_number || awb)) {
      // Find matching order
      let targetOrder = DataStore.getOrders().find(
        (o) => o.id === order_id || o.order_number === order_number || o.tracking_number === awb
      );

      if (targetOrder) {
        await DataStore.updateOrderStatus(
          targetOrder.id,
          targetStatus,
          `Carrier update from ${courier || 'Courier'}: ${current_status} at ${location || 'Hub'}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      processed_status: targetStatus || current_status,
    });
  } catch (err: any) {
    console.error('Courier webhook error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
