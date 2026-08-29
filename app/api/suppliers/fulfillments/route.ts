import { NextRequest, NextResponse } from 'next/server';
import { SupplierService } from '@/lib/services/supplier-service';

export async function GET() {
  try {
    const fulfillments = SupplierService.getFulfillments();
    const mappings = SupplierService.getProductMappings();
    return NextResponse.json({
      success: true,
      fulfillments,
      totalCount: fulfillments.length,
      mappingsCount: mappings.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Failed to fetch fulfillments' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, fulfillmentId } = body;

    // Action 1: Push single fulfillment order
    if (action === 'push_single' && fulfillmentId) {
      const result = await SupplierService.pushFulfillmentToSupplier(fulfillmentId);
      return NextResponse.json(result);
    }

    // Action 2: Bulk push all unfulfilled/queued orders
    if (action === 'bulk_push') {
      const bulkResult = await SupplierService.bulkPushFulfillments();
      return NextResponse.json({
        success: true,
        message: `Successfully processed ${bulkResult.pushedCount} supplier orders (${bulkResult.failedCount} errors).`,
        details: bulkResult,
      });
    }

    return NextResponse.json({ success: false, message: 'Invalid fulfillment action' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
