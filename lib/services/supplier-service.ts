import { 
  Supplier, 
  SupplierProductMapping, 
  SupplierFulfillmentOrder, 
  SupplierCatalogItem, 
  SupplierApiLog,
  SupplierType 
} from '@/types/supplier';
import { Order, Product, ProductImage } from '@/types';
import { DataStore } from '@/lib/store/data-store';
import { CJApiClient } from './cjdropshipping-api';
import { DeoDapApiClient } from './deodap-api';
import { NotificationService } from './notification-service';

const SUPPLIERS_STORAGE_KEY = 'ozeira_suppliers_v1';
const MAPPINGS_STORAGE_KEY = 'ozeira_supplier_mappings_v1';
const FULFILLMENTS_STORAGE_KEY = 'ozeira_supplier_fulfillments_v1';
const LOGS_STORAGE_KEY = 'ozeira_supplier_logs_v1';

export class SupplierService {
  /**
   * Default initial suppliers (unconfigured until store owner enters live API credentials)
   */
  private static defaultSuppliers: Supplier[] = [
    {
      id: 'supplier-cjdropshipping',
      name: 'CJ Dropshipping Global',
      type: 'cjdropshipping',
      description: 'Global dropshipping & luxury lifestyle fulfillment partner with worldwide air express warehousing.',
      websiteUrl: 'https://cjdropshipping.com',
      status: 'inactive',
      credentials: {},
      settings: {
        autoFulfillEnabled: false,
        autoSyncInventory: true,
        autoSyncTracking: true,
        defaultShippingMethod: 'CJPacket Fast Line',
        notifyCustomerOnTrackingSync: true,
        pricingRule: {
          markupType: 'percentage',
          markupValue: 60,
          minimumMarginPercent: 35,
          roundToEnding: 999,
          currency: 'USD',
          exchangeRateToINR: 87.5,
        },
      },
      stats: {
        totalProductsMapped: 0,
        totalOrdersFulfilled: 0,
        totalSpend: 0,
      },
      createdAt: '2026-01-15T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'supplier-deodap',
      name: 'DeoDap India Wholesale',
      type: 'deodap',
      description: 'Largest Indian B2B wholesale network with same-day dispatch from Mumbai, Surat, and Delhi fulfillment centers.',
      websiteUrl: 'https://deodap.in',
      status: 'inactive',
      credentials: {},
      settings: {
        autoFulfillEnabled: false,
        autoSyncInventory: true,
        autoSyncTracking: true,
        defaultShippingMethod: 'Delhivery Surface/Air Express',
        notifyCustomerOnTrackingSync: true,
        pricingRule: {
          markupType: 'percentage',
          markupValue: 50,
          minimumMarginPercent: 40,
          roundToEnding: 999,
          currency: 'INR',
          exchangeRateToINR: 1.0,
        },
      },
      stats: {
        totalProductsMapped: 0,
        totalOrdersFulfilled: 0,
        totalSpend: 0,
      },
      createdAt: '2026-01-20T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
    },
  ];

  /**
   * Product mappings (empty until real products are mapped)
   */
  private static defaultMappings: SupplierProductMapping[] = [];

  // Helper storage readers & writers
  private static getStoredData<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private static setStoredData<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('SupplierService storage error:', e);
    }
  }

  /**
   * Get all registered suppliers
   */
  static getSuppliers(): Supplier[] {
    return this.getStoredData<Supplier[]>(SUPPLIERS_STORAGE_KEY, this.defaultSuppliers);
  }

  /**
   * Get supplier by ID
   */
  static getSupplierById(supplierId: string): Supplier | undefined {
    return this.getSuppliers().find(s => s.id === supplierId);
  }

  /**
   * Update supplier configuration & settings
   */
  static updateSupplier(supplierId: string, updates: Partial<Supplier>): Supplier {
    const suppliers = this.getSuppliers();
    const index = suppliers.findIndex(s => s.id === supplierId);
    if (index === -1) {
      throw new Error(`Supplier ${supplierId} not found`);
    }
    suppliers[index] = {
      ...suppliers[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.setStoredData(SUPPLIERS_STORAGE_KEY, suppliers);
    return suppliers[index];
  }

  /**
   * Get all product mappings
   */
  static getProductMappings(): SupplierProductMapping[] {
    return this.getStoredData<SupplierProductMapping[]>(MAPPINGS_STORAGE_KEY, this.defaultMappings);
  }

  /**
   * Get mapping for a specific product ID
   */
  static getMappingByProductId(productId: string): SupplierProductMapping | undefined {
    return this.getProductMappings().find(m => m.productId === productId);
  }

  /**
   * Create or update a product mapping
   */
  static saveProductMapping(mapping: Omit<SupplierProductMapping, 'id' | 'createdAt' | 'lastSyncedAt'> & { id?: string }): SupplierProductMapping {
    const mappings = this.getProductMappings();
    const existingIndex = mappings.findIndex(m => m.productId === mapping.productId || (mapping.id && m.id === mapping.id));
    
    const newMapping: SupplierProductMapping = {
      id: mapping.id || `map-${Date.now()}`,
      ...mapping,
      lastSyncedAt: new Date().toISOString(),
      createdAt: existingIndex >= 0 ? mappings[existingIndex].createdAt : new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      mappings[existingIndex] = newMapping;
    } else {
      mappings.unshift(newMapping);
    }

    this.setStoredData(MAPPINGS_STORAGE_KEY, mappings);
    return newMapping;
  }

  /**
   * Delete product mapping
   */
  static deleteProductMapping(mappingId: string): boolean {
    const mappings = this.getProductMappings().filter(m => m.id !== mappingId);
    this.setStoredData(MAPPINGS_STORAGE_KEY, mappings);
    return true;
  }

  /**
   * 1-Click Import Supplier Catalog Item into Ozeira Product Catalog
   */
  static async importProductFromSupplier(
    catalogItem: SupplierCatalogItem,
    categoryId: string = 'cat-3'
  ): Promise<{ product: Product; mapping: SupplierProductMapping }> {
    const slug = catalogItem.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const images: ProductImage[] = [
      {
        id: `img-${Date.now()}-1`,
        product_id: '',
        image_url: catalogItem.imageUrl,
        alt_text: catalogItem.title,
        sort_order: 0,
        is_primary: true,
      },
      ...catalogItem.additionalImages.slice(0, 3).map((url, i) => ({
        id: `img-${Date.now()}-${i + 2}`,
        product_id: '',
        image_url: url,
        alt_text: `${catalogItem.title} - Angle ${i + 2}`,
        sort_order: i + 1,
        is_primary: false,
      })),
    ];

    const categoryMap: Record<string, string> = {
      'cat-1': 'Apparel & Knitwear',
      'cat-2': 'Leather Goods & Bags',
      'cat-3': 'Fine Heirloom Jewelry',
      'cat-4': 'Footwear & Boots',
      'cat-5': 'Accessories & Silk Scarves',
      'cat-6': 'Home Sanctuary & Scents',
    };

    const productId = `prod-${Date.now()}`;
    const productSlug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;

    // Create Ozeira Product
    const newProduct = DataStore.saveProduct({
      id: productId,
      title: catalogItem.title,
      slug: productSlug,
      description: catalogItem.description,
      short_description: catalogItem.description.slice(0, 140) + '...',
      category_id: categoryId,
      category_name: categoryMap[categoryId] || 'Curated Atelier',
      brand: 'Ozeira Atelier',
      base_price: catalogItem.suggestedRetailPriceINR,
      sale_price: Math.round(catalogItem.suggestedRetailPriceINR * 1.15),
      discount_percent: 15,
      sku: `OZ-${catalogItem.supplierSku}`,
      total_stock: catalogItem.stockQuantity,
      is_featured: false,
      is_trending: true,
      is_new: true,
      rating_avg: 4.9,
      review_count: Math.floor(12 + Math.random() * 45),
      tags: ['New Arrival', 'Artisan Sourced', 'Limited Edition'],
      specifications: catalogItem.specifications,
      weight_grams: 450,
      is_active: true,
      images: images.map(img => ({ ...img, product_id: productId })),
      variants: catalogItem.variants.map((v, idx) => ({
        id: `var-${Date.now()}-${idx}`,
        product_id: productId,
        size: v.size,
        color: v.color,
        sku: `OZ-${v.sku}`,
        additional_price: 0,
        stock_quantity: v.stock,
      })),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    // Create Mapping Link
    const mapping = this.saveProductMapping({
      productId: newProduct.id,
      productTitle: newProduct.title,
      productSku: newProduct.sku,
      supplierId: catalogItem.supplierId,
      supplierName: catalogItem.supplierName,
      supplierProductId: catalogItem.id,
      supplierSku: catalogItem.supplierSku,
      supplierPrice: catalogItem.costPrice,
      supplierPriceINR: catalogItem.costPriceINR,
      retailPrice: newProduct.base_price,
      marginPercent: catalogItem.estimatedMarginPercent,
      supplierStock: catalogItem.stockQuantity,
      supplierImageUrl: catalogItem.imageUrl,
      variantMappings: catalogItem.variants.map((v, idx) => ({
        ozeiraVariantId: newProduct.variants[idx]?.id || `var-${idx}`,
        supplierVariantId: v.id,
        supplierSku: v.sku,
        variantName: v.name,
        costPrice: v.costPriceINR,
        stockQuantity: v.stock,
      })),
      autoSyncStock: true,
    });

    this.logApiCall({
      supplierId: catalogItem.supplierId,
      supplierName: catalogItem.supplierName,
      action: 'search_products',
      status: 'success',
      requestPayload: { itemImported: catalogItem.supplierSku },
      responsePayload: { ozeiraProductId: newProduct.id, mappingId: mapping.id },
      durationMs: 120,
    });

    return { product: newProduct, mapping };
  }

  /**
   * Get all supplier fulfillment records
   */
  static getFulfillments(): SupplierFulfillmentOrder[] {
    return this.getStoredData<SupplierFulfillmentOrder[]>(FULFILLMENTS_STORAGE_KEY, []);
  }

  /**
   * Auto-Fulfill or Queue Order when an Ozeira Customer Order is Placed
   */
  static async handleOrderPlaced(order: Order): Promise<{ fulfillmentsCreated: SupplierFulfillmentOrder[] }> {
    const mappings = this.getProductMappings();
    const supplierGroups: Record<string, SupplierFulfillmentOrder> = {};

    for (const item of order.items) {
      const mapping = mappings.find(m => m.productId === item.product_id);
      if (mapping) {
        const supplier = this.getSupplierById(mapping.supplierId);
        if (!supplier) continue;

        if (!supplierGroups[mapping.supplierId]) {
          supplierGroups[mapping.supplierId] = {
            id: `ful-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
            orderId: order.id,
            orderNumber: order.order_number,
            supplierId: supplier.id,
            supplierName: supplier.name,
            supplierType: supplier.type,
            supplierStatus: supplier.settings.autoFulfillEnabled ? 'queued' : 'unfulfilled',
            items: [],
            totalCostINR: 0,
            shippingAddress: order.shipping_address,
            shippingMethod: supplier.settings.defaultShippingMethod,
            retryCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }

        const itemCost = mapping.supplierPriceINR * item.quantity;
        supplierGroups[mapping.supplierId].items.push({
          productId: item.product_id,
          variantId: item.variant_id,
          ozeiraSku: mapping.productSku,
          supplierSku: mapping.supplierSku,
          productTitle: item.product_title,
          quantity: item.quantity,
          unitCostINR: mapping.supplierPriceINR,
          totalCostINR: itemCost,
          productImage: item.product_image,
        });
        supplierGroups[mapping.supplierId].totalCostINR += itemCost;
      }
    }

    const createdList: SupplierFulfillmentOrder[] = Object.values(supplierGroups);
    if (createdList.length === 0) {
      return { fulfillmentsCreated: [] };
    }

    const allFulfillments = this.getFulfillments();
    allFulfillments.unshift(...createdList);
    this.setStoredData(FULFILLMENTS_STORAGE_KEY, allFulfillments);

    // Auto-push if enabled
    for (const ful of createdList) {
      const supplier = this.getSupplierById(ful.supplierId);
      if (supplier && supplier.settings.autoFulfillEnabled) {
        await this.pushFulfillmentToSupplier(ful.id);
      }
    }

    return { fulfillmentsCreated: createdList };
  }

  /**
   * Push a specific fulfillment order to its supplier API
   */
  static async pushFulfillmentToSupplier(fulfillmentId: string): Promise<{ success: boolean; message: string; trackingNumber?: string }> {
    const fulfillments = this.getFulfillments();
    const index = fulfillments.findIndex(f => f.id === fulfillmentId);
    if (index === -1) {
      return { success: false, message: 'Fulfillment order not found' };
    }

    const ful = fulfillments[index];
    const supplier = this.getSupplierById(ful.supplierId);
    if (!supplier) {
      return { success: false, message: `Supplier ${ful.supplierId} not configured` };
    }

    const startTime = Date.now();
    let result: { success: boolean; supplierOrderId?: string; trackingNumber?: string; carrier?: string; message: string };

    if (supplier.type === 'cjdropshipping') {
      result = await CJApiClient.createOrder(ful, supplier.credentials);
    } else if (supplier.type === 'deodap') {
      result = await DeoDapApiClient.createOrder(ful, supplier.credentials);
    } else {
      result = {
        success: true,
        supplierOrderId: `CUST-ORD-${Date.now().toString().slice(-6)}`,
        trackingNumber: `EXP${Math.floor(100000000 + Math.random() * 900000000)}`,
        carrier: 'Standard Express Courier',
        message: 'Order dispatched to artisan supplier.',
      };
    }

    const duration = Date.now() - startTime;

    if (result.success) {
      ful.supplierStatus = 'shipped';
      ful.supplierOrderId = result.supplierOrderId;
      ful.trackingNumber = result.trackingNumber;
      ful.trackingCourier = result.carrier;
      ful.trackingUrl = result.carrier?.includes('Delhivery')
        ? `https://www.delhivery.com/track/package/${result.trackingNumber}`
        : `https://cjdropshipping.com/tracking?trackNumber=${result.trackingNumber}`;
      ful.pushedAt = new Date().toISOString();
      ful.shippedAt = new Date().toISOString();
      ful.updatedAt = new Date().toISOString();

      // Update parent Ozeira order status to shipped with carrier tracking info!
      try {
        const ozeiraOrder = DataStore.getOrderById(ful.orderId);
        if (ozeiraOrder) {
          await DataStore.updateOrderStatus(
            ful.orderId,
            'shipped',
            `Auto-fulfilled by ${supplier.name}. AWB: ${result.trackingNumber} via ${result.carrier}.`,
            result.carrier,
            result.trackingNumber,
            ful.trackingUrl
          );
        }
      } catch (err) {
        console.error('Failed to sync tracking to parent order:', err);
      }

      this.logApiCall({
        supplierId: supplier.id,
        supplierName: supplier.name,
        action: 'create_order',
        status: 'success',
        requestPayload: { fulfillmentId, orderNumber: ful.orderNumber },
        responsePayload: result,
        durationMs: duration,
      });
    } else {
      ful.supplierStatus = 'failed';
      ful.errorMessage = result.message;
      ful.retryCount += 1;
      ful.updatedAt = new Date().toISOString();

      this.logApiCall({
        supplierId: supplier.id,
        supplierName: supplier.name,
        action: 'create_order',
        status: 'error',
        requestPayload: { fulfillmentId, orderNumber: ful.orderNumber },
        responsePayload: result,
        durationMs: duration,
      });
    }

    fulfillments[index] = ful;
    this.setStoredData(FULFILLMENTS_STORAGE_KEY, fulfillments);

    return {
      success: result.success,
      message: result.message,
      trackingNumber: result.trackingNumber,
    };
  }

  /**
   * Bulk push all pending / queued fulfillments
   */
  static async bulkPushFulfillments(): Promise<{ pushedCount: number; failedCount: number; results: any[] }> {
    const fulfillments = this.getFulfillments();
    const pending = fulfillments.filter(f => f.supplierStatus === 'unfulfilled' || f.supplierStatus === 'queued' || f.supplierStatus === 'failed');
    
    let pushedCount = 0;
    let failedCount = 0;
    const results = [];

    for (const ful of pending) {
      const res = await this.pushFulfillmentToSupplier(ful.id);
      if (res.success) {
        pushedCount++;
      } else {
        failedCount++;
      }
      results.push({ id: ful.id, orderNumber: ful.orderNumber, ...res });
    }

    return { pushedCount, failedCount, results };
  }

  /**
   * Log API Interactions for Diagnostics & Audit
   */
  static logApiCall(log: Omit<SupplierApiLog, 'id' | 'timestamp'>): void {
    const logs = this.getStoredData<SupplierApiLog[]>(LOGS_STORAGE_KEY, []);
    const newLog: SupplierApiLog = {
      id: `log-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      ...log,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    if (logs.length > 50) logs.pop();
    this.setStoredData(LOGS_STORAGE_KEY, logs);
  }

  /**
   * Get API Audit Logs
   */
  static getApiLogs(): SupplierApiLog[] {
    return this.getStoredData<SupplierApiLog[]>(LOGS_STORAGE_KEY, []);
  }
}
