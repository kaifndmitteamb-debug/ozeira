import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { DataStore } from '@/lib/store/data-store';
import { Order } from '@/types';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  // 1. Fetch Order details
  let order: Order | undefined;

  if (isSupabaseConfigured) {
    try {
      const { data: dbOrder } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq.${orderId},order_number.eq.${orderId}`)
        .single();

      if (dbOrder) {
        const { data: dbItems } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', dbOrder.id);

        order = {
          ...dbOrder,
          items: dbItems || dbOrder.items || [],
        };
      }
    } catch (e) {
      console.warn('Could not fetch order from Supabase for invoice:', e);
    }
  }

  if (!order) {
    order = DataStore.getOrders().find((o) => o.id === orderId || o.order_number === orderId);
  }

  if (!order) {
    return new NextResponse('Order not found', { status: 404 });
  }

  // 2. Fetch Store / Business Settings
  let settings = DataStore.getSettings();
  if (isSupabaseConfigured) {
    try {
      const { data: dbSettings } = await supabase
        .from('store_settings')
        .select('value')
        .eq('key', 'global_settings')
        .single();
      if (dbSettings?.value) {
        settings = { ...settings, ...dbSettings.value };
      }
    } catch (e) {
      console.warn('Could not fetch store settings from Supabase for invoice:', e);
    }
  }

  const business = settings.business || {
    legalName: 'Ozeira Luxury Atelier Private Limited',
    tradeName: 'Ozeira Atelier',
    gstin: '27AAEC01234F1Z5',
    pan: 'AAEC01234F',
    registeredAddress: '42 Heritage Boulevard, Altamount Road, Cumballa Hill, Mumbai, Maharashtra 400026',
    supportEmail: 'invoicing@ozeira.com',
    supportPhone: '+91 98765 43210',
  };

  const invoiceNumber = `INV-${order.order_number.replace(/^OZ-/, '')}`;
  const invoiceDate = new Date(order.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  const isInterState = order.shipping_address?.state?.toLowerCase() !== 'maharashtra';
  const taxRate = (settings.tax?.percentage || 12) / 100;
  const taxableAmount = Math.round(order.subtotal / (1 + taxRate));
  const totalTax = order.subtotal - taxableAmount;
  const cgst = isInterState ? 0 : Math.round(totalTax / 2);
  const sgst = isInterState ? 0 : Math.round(totalTax / 2);
  const igst = isInterState ? totalTax : 0;

  const itemsHtml = (order.items || []).map((item, index) => {
    const isJewelry = item.product_title?.toLowerCase().includes('necklace') || item.product_title?.toLowerCase().includes('ring') || item.product_title?.toLowerCase().includes('bracelet');
    const hsn = isJewelry ? '7113' : '6204';
    const itemTaxable = Math.round(item.total_price / (1 + taxRate));
    const itemTax = item.total_price - itemTaxable;

    return `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; text-align: center; color: #737373;">${index + 1}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5;">
          <div style="font-weight: 600; color: #171717;">${item.product_title}</div>
          <div style="font-size: 11px; color: #737373; margin-top: 2px;">
            ${item.variant_details?.size ? `Size: ${item.variant_details.size} ` : ''}
            ${item.variant_details?.color ? `• Color: ${item.variant_details.color} ` : ''}
            ${item.variant_details?.sku ? `• SKU: ${item.variant_details.sku}` : ''}
          </div>
        </td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; text-align: center; font-family: monospace; font-size: 11px; color: #525252;">${hsn}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; text-align: center; color: #171717;">${item.quantity}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; text-align: right; color: #171717;">₹${item.unit_price.toLocaleString('en-IN')}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; text-align: right; color: #171717;">₹${itemTaxable.toLocaleString('en-IN')}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; text-align: right; color: #525252; font-size: 11px;">${(taxRate * 100).toFixed(0)}% (₹${itemTax.toLocaleString('en-IN')})</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #e5e5e5; text-align: right; font-weight: 600; color: #171717;">₹${item.total_price.toLocaleString('en-IN')}</td>
      </tr>
    `;
  }).join('');

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Tax Invoice #${invoiceNumber} - Ozeira Atelier</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 30px;
      color: #171717;
      background: #fdfbf9;
      font-size: 12px;
      line-height: 1.5;
    }
    .invoice-container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      padding: 40px;
      border: 1px solid #e5e5e5;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.04);
    }
    .no-print {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-bottom: 20px;
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
    }
    .btn {
      padding: 8px 18px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      border: 1px solid transparent;
      transition: all 0.2s;
    }
    .btn-primary {
      background: #c46331;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #a34c28;
    }
    .btn-secondary {
      background: #ffffff;
      color: #171717;
      border-color: #d4d4d4;
    }
    .btn-secondary:hover {
      background: #f5f5f5;
    }
    table { width: 100%; border-collapse: collapse; }
    @media print {
      body { padding: 0; background: #ffffff; }
      .invoice-container { border: none; box-shadow: none; padding: 0; }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>

  <div class="no-print">
    <button onclick="window.history.back()" class="btn btn-secondary">← Back</button>
    <button onclick="window.print()" class="btn btn-primary">🖨️ Print / Save as PDF</button>
  </div>

  <div class="invoice-container">
    
    <!-- Top Header -->
    <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1a1714; padding-bottom: 24px; margin-bottom: 24px;">
      <div>
        <div style="font-family: Georgia, serif; font-size: 26px; letter-spacing: 4px; font-weight: bold; color: #1a1714; text-transform: uppercase;">OZEIRA</div>
        <div style="font-size: 10px; letter-spacing: 2px; color: #c46331; text-transform: uppercase; font-weight: bold; margin-top: 2px;">Atelier of Haute Craftsmanship</div>
        <div style="font-size: 11px; color: #525252; margin-top: 8px; line-height: 1.4;">
          <strong>${business.legalName || 'Ozeira Atelier Pvt Ltd'}</strong><br>
          ${business.registeredAddress || '42 Heritage Boulevard, Mumbai 400026'}<br>
          GSTIN: <strong>${business.gstin || '27AAEC01234F1Z5'}</strong> | PAN: <strong>${business.pan || 'AAEC01234F'}</strong><br>
          Support: ${business.supportEmail || 'care@ozeira.com'} | ${business.supportPhone || '+91 98765 43210'}
        </div>
      </div>

      <div style="text-align: right;">
        <div style="display: inline-block; background: #1a1714; color: #ffffff; padding: 4px 12px; border-radius: 4px; font-size: 11px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">TAX INVOICE</div>
        <div style="font-size: 14px; font-weight: bold; color: #171717;">Invoice: #${invoiceNumber}</div>
        <div style="font-size: 11px; color: #525252; margin-top: 2px;">Order Ref: #${order.order_number}</div>
        <div style="font-size: 11px; color: #525252;">Date of Issue: ${invoiceDate}</div>
        <div style="font-size: 11px; color: #525252;">Place of Supply: ${order.shipping_address?.state || 'Maharashtra'} (0${isInterState ? '9' : '7'})</div>
      </div>
    </div>

    <!-- Bill To / Ship To Grid -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; background: #fafaf9; border: 1px solid #f5f5f4; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <div>
        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #737373; margin-bottom: 4px;">Billed To:</div>
        <div style="font-weight: 600; color: #171717;">${order.shipping_address?.full_name || order.user_name || 'Valued Patron'}</div>
        <div style="color: #525252; font-size: 11px; margin-top: 2px; line-height: 1.4;">
          ${order.shipping_address?.street || ''} ${order.shipping_address?.apartment || ''}<br>
          ${order.shipping_address?.city || ''}, ${order.shipping_address?.state || ''} ${order.shipping_address?.postal_code || ''}<br>
          ${order.guest_email ? `Email: ${order.guest_email}<br>` : ''}
          ${order.shipping_address?.phone ? `Contact: ${order.shipping_address.phone}` : ''}
        </div>
      </div>

      <div>
        <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #737373; margin-bottom: 4px;">Payment & Logistics:</div>
        <div style="color: #525252; font-size: 11px; line-height: 1.4;">
          Payment Method: <strong style="color: #171717; text-transform: uppercase;">${order.payment_method}</strong> (${order.payment_status.toUpperCase()})<br>
          ${order.razorpay_payment_id ? `Transaction ID: <span style="font-family: monospace;">${order.razorpay_payment_id}</span><br>` : ''}
          ${order.tracking_courier ? `Carrier: <strong>${order.tracking_courier}</strong><br>` : ''}
          ${order.tracking_number ? `AWB Tracking: <strong>${order.tracking_number}</strong><br>` : ''}
          Status: <strong style="color: #c46331; text-transform: uppercase;">${order.status.replace(/_/g, ' ')}</strong>
        </div>
      </div>
    </div>

    <!-- Items Table -->
    <table style="margin-bottom: 24px;">
      <thead>
        <tr style="background: #1a1714; color: #ffffff; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px;">
          <th style="padding: 8px 12px; text-align: center; width: 40px;">#</th>
          <th style="padding: 8px 12px; text-align: left;">Item Description</th>
          <th style="padding: 8px 12px; text-align: center; width: 60px;">HSN</th>
          <th style="padding: 8px 12px; text-align: center; width: 40px;">Qty</th>
          <th style="padding: 8px 12px; text-align: right; width: 85px;">Unit Rate</th>
          <th style="padding: 8px 12px; text-align: right; width: 85px;">Taxable</th>
          <th style="padding: 8px 12px; text-align: right; width: 95px;">GST</th>
          <th style="padding: 8px 12px; text-align: right; width: 95px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>

    <!-- Totals Summary & Tax Breakdown -->
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px;">
      
      <!-- Tax Breakdown Box -->
      <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 14px; font-size: 11px; background: #ffffff;">
        <div style="font-weight: bold; text-transform: uppercase; font-size: 10px; color: #737373; border-bottom: 1px solid #e5e5e5; padding-bottom: 4px; margin-bottom: 8px;">
          Statutory Tax Summary
        </div>
        <table style="color: #525252;">
          <tr>
            <td style="padding: 2px 0;">Total Taxable Value:</td>
            <td style="text-align: right; font-weight: 600; color: #171717;">₹${taxableAmount.toLocaleString('en-IN')}</td>
          </tr>
          ${!isInterState ? `
          <tr>
            <td style="padding: 2px 0;">CGST (${((taxRate/2)*100).toFixed(1)}%):</td>
            <td style="text-align: right;">₹${cgst.toLocaleString('en-IN')}</td>
          </tr>
          <tr>
            <td style="padding: 2px 0;">SGST (${((taxRate/2)*100).toFixed(1)}%):</td>
            <td style="text-align: right;">₹${sgst.toLocaleString('en-IN')}</td>
          </tr>
          ` : `
          <tr>
            <td style="padding: 2px 0;">IGST (${(taxRate*100).toFixed(1)}%):</td>
            <td style="text-align: right;">₹${igst.toLocaleString('en-IN')}</td>
          </tr>
          `}
          <tr style="border-top: 1px solid #e5e5e5; font-weight: bold; color: #171717;">
            <td style="padding: 4px 0 0 0;">Total Tax Amount:</td>
            <td style="text-align: right; padding: 4px 0 0 0;">₹${totalTax.toLocaleString('en-IN')}</td>
          </tr>
        </table>
      </div>

      <!-- Financial Totals -->
      <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 14px; background: #fafaf9; font-size: 11px;">
        <table>
          <tr>
            <td style="padding: 3px 0; color: #525252;">Items Subtotal:</td>
            <td style="text-align: right; font-weight: 600;">₹${order.subtotal?.toLocaleString('en-IN')}</td>
          </tr>
          ${order.discount_amount ? `
          <tr>
            <td style="padding: 3px 0; color: #16a34a;">Voucher Discount:</td>
            <td style="text-align: right; color: #16a34a;">-₹${order.discount_amount.toLocaleString('en-IN')}</td>
          </tr>` : ''}
          ${order.loyalty_discount_amount ? `
          <tr>
            <td style="padding: 3px 0; color: #16a34a;">Loyalty Points Discount:</td>
            <td style="text-align: right; color: #16a34a;">-₹${order.loyalty_discount_amount.toLocaleString('en-IN')}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 3px 0; color: #525252;">Insured Express Shipping:</td>
            <td style="text-align: right;">${order.shipping_fee === 0 ? 'COMPLIMENTARY' : `₹${order.shipping_fee}`}</td>
          </tr>
          <tr style="border-top: 2px solid #1a1714; font-size: 14px; font-weight: bold; color: #1a1714;">
            <td style="padding: 8px 0 0 0;">Grand Total (INR):</td>
            <td style="text-align: right; padding: 8px 0 0 0; color: #c46331;">₹${order.total_amount?.toLocaleString('en-IN')}</td>
          </tr>
        </table>
      </div>

    </div>

    <!-- Declaration & Signatory -->
    <div style="border-top: 1px solid #e5e5e5; padding-top: 20px; display: grid; grid-template-columns: 2fr 1fr; gap: 24px; font-size: 10px; color: #737373;">
      <div>
        <div style="font-weight: bold; text-transform: uppercase; color: #171717; margin-bottom: 4px;">Terms & Conditions:</div>
        <p style="margin: 0 0 4px 0;">1. All goods sold are certified authentic by Ozeira Atelier with luxury authenticity guarantees.</p>
        <p style="margin: 0 0 4px 0;">2. Returns or size exchanges are accepted within 7 business days of delivery in pristine, unworn condition with security tags intact.</p>
        <p style="margin: 0;">3. This document is a computer-generated tax invoice issued under Section 31 of the CGST Act, 2017.</p>
      </div>

      <div style="text-align: right; display: flex; flex-direction: column; justify-content: flex-end; align-items: flex-end;">
        <div style="font-family: Georgia, serif; font-size: 14px; font-style: italic; color: #1a1714; margin-bottom: 4px;">Ozeira Atelier Authorized</div>
        <div style="font-size: 9px; text-transform: uppercase; letter-spacing: 0.5px; color: #a3a3a3; border-top: 1px solid #d4d4d4; padding-top: 4px; width: 140px; text-align: center;">
          Authorized Signatory
        </div>
      </div>
    </div>

  </div>

</body>
</html>
  `;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
