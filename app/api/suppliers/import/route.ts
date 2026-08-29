import { NextRequest, NextResponse } from 'next/server';
import { SupplierService } from '@/lib/services/supplier-service';
import { SupplierCatalogItem } from '@/types/supplier';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { catalogItem, categoryId, customMarkupPercent } = body as {
      catalogItem: SupplierCatalogItem;
      categoryId?: string;
      customMarkupPercent?: number;
    };

    if (!catalogItem || !catalogItem.title) {
      return NextResponse.json({ success: false, message: 'Invalid product data for import' }, { status: 400 });
    }

    if (customMarkupPercent && customMarkupPercent > 0) {
      catalogItem.suggestedRetailPriceINR = Math.round(catalogItem.costPriceINR * (1 + customMarkupPercent / 100));
      catalogItem.estimatedMarginPercent = Math.round(((catalogItem.suggestedRetailPriceINR - catalogItem.costPriceINR) / catalogItem.suggestedRetailPriceINR) * 100);
    }

    const { product, mapping } = await SupplierService.importProductFromSupplier(
      catalogItem,
      categoryId || 'cat-3'
    );

    return NextResponse.json({
      success: true,
      message: `"${product.title}" imported successfully to Ozeira Atelier!`,
      product,
      mapping,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Import failed' }, { status: 500 });
  }
}
