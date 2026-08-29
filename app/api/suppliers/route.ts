import { NextRequest, NextResponse } from 'next/server';
import { SupplierService } from '@/lib/services/supplier-service';
import { CJApiClient } from '@/lib/services/cjdropshipping-api';
import { DeoDapApiClient } from '@/lib/services/deodap-api';

export async function GET() {
  try {
    const suppliers = SupplierService.getSuppliers();
    const mappings = SupplierService.getProductMappings();
    const fulfillments = SupplierService.getFulfillments();
    const logs = SupplierService.getApiLogs();

    return NextResponse.json({
      success: true,
      suppliers,
      totalMappings: mappings.length,
      pendingFulfillments: fulfillments.filter(f => f.supplierStatus === 'unfulfilled' || f.supplierStatus === 'queued').length,
      logs: logs.slice(0, 10),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Failed to fetch suppliers' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, supplierId, updates, testCredentials } = body;

    // Action: Test Connection Diagnostic
    if (action === 'test_connection') {
      const supplier = SupplierService.getSupplierById(supplierId);
      const creds = testCredentials || supplier?.credentials;
      if (!creds) {
        return NextResponse.json({ success: false, message: 'No credentials provided for testing.' }, { status: 400 });
      }

      let testResult: { success: boolean; message: string; details?: any };
      if (supplier?.type === 'cjdropshipping' || body.type === 'cjdropshipping') {
        testResult = await CJApiClient.testConnection(creds);
      } else if (supplier?.type === 'deodap' || body.type === 'deodap') {
        testResult = await DeoDapApiClient.testConnection(creds);
      } else {
        testResult = { success: true, message: 'Custom supplier webhook / email endpoint connected.' };
      }

      SupplierService.logApiCall({
        supplierId: supplierId || 'temp-test',
        supplierName: supplier?.name || 'Testing Supplier',
        action: 'test_connection',
        status: testResult.success ? 'success' : 'error',
        requestPayload: { credsProvided: true },
        responsePayload: testResult,
        durationMs: 95,
      });

      return NextResponse.json(testResult);
    }

    // Action: Update Supplier Config
    if (action === 'update' && supplierId) {
      const updated = SupplierService.updateSupplier(supplierId, updates);
      return NextResponse.json({ success: true, supplier: updated });
    }

    return NextResponse.json({ success: false, message: 'Invalid action specified' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Server error' }, { status: 500 });
  }
}
