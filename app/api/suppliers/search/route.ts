import { NextRequest, NextResponse } from 'next/server';
import { CJApiClient } from '@/lib/services/cjdropshipping-api';
import { DeoDapApiClient } from '@/lib/services/deodap-api';
import { SupplierService } from '@/lib/services/supplier-service';
import { SupplierCatalogItem } from '@/types/supplier';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const supplierType = searchParams.get('supplier') || 'all'; // 'cjdropshipping' | 'deodap' | 'all'
    const page = parseInt(searchParams.get('page') || '1', 10);

    const cjSupplier = SupplierService.getSupplierById('supplier-cjdropshipping');
    const ddSupplier = SupplierService.getSupplierById('supplier-deodap');

    let allItems: SupplierCatalogItem[] = [];

    if (supplierType === 'all' || supplierType === 'cjdropshipping') {
      const cjRes = await CJApiClient.searchProducts(
        query,
        page,
        cjSupplier?.settings.pricingRule,
        cjSupplier?.credentials
      );
      allItems.push(...cjRes.items);
    }

    if (supplierType === 'all' || supplierType === 'deodap') {
      const ddRes = await DeoDapApiClient.searchProducts(
        query,
        page,
        ddSupplier?.settings.pricingRule,
        ddSupplier?.credentials
      );
      allItems.push(...ddRes.items);
    }

    // Check which items are already mapped in Ozeira
    const existingMappings = SupplierService.getProductMappings();
    const mappedSkus = new Set(existingMappings.map(m => m.supplierSku));

    const enrichedItems = allItems.map(item => ({
      ...item,
      isAlreadyImported: mappedSkus.has(item.supplierSku),
    }));

    return NextResponse.json({
      success: true,
      query,
      items: enrichedItems,
      total: enrichedItems.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Search failed' }, { status: 500 });
  }
}
