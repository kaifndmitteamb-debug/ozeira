import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { NotificationService } from '@/lib/services/notification-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, order_number, user_id, recipient_email, items, return_type, reason, exchange_size, customer_notes } = body;

    console.log(`📦 [Returns API] Return requested for Order #${order_number} (${return_type}): ${reason}`);

    // 1. Record notification in Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from('notification_logs').insert([
          {
            id: `notif-return-${Date.now()}`,
            user_id: user_id || null,
            channel: 'email',
            event_type: 'return_requested',
            recipient: recipient_email || 'care@ozeira.com',
            content: `Return Request Registered for Order #${order_number}`,
            status: 'sent',
            metadata: {
              order_id,
              order_number,
              return_type,
              reason,
              exchange_size,
              customer_notes,
              items_count: items?.length || 0,
            },
          },
        ]);
      } catch (dbErr) {
        console.error('Error logging return request to Supabase:', dbErr);
      }
    }

    // 2. Dispatch Customer Confirmation Email via NotificationService
    if (recipient_email) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: recipient_email,
            subject: `Ozeira Atelier: ${return_type === 'exchange' ? 'Size Exchange' : 'Return'} Request Registered #${order_number}`,
            html: `
              <div style="font-family: Georgia, serif; padding: 32px; background: #fdfbf9; border: 1px solid #e7e5e4; border-radius: 16px; color: #1c1917; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1714; letter-spacing: 3px; text-transform: uppercase; margin-top: 0; text-align: center;">OZEIRA</h2>
                <div style="text-align: center; color: #c46331; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px;">Atelier of Haute Craftsmanship</div>
                
                <h3 style="color: #1c1917; font-size: 18px; margin-bottom: 12px;">Your ${return_type === 'exchange' ? 'Size Exchange' : 'Return'} Request is Registered</h3>
                <p style="font-size: 13px; line-height: 1.6; color: #57534e;">
                  Thank you for contacting Ozeira Atelier. We have received your request for Order <strong>#${order_number}</strong>.
                </p>

                <div style="background: #ffffff; border: 1px solid #e7e5e4; border-radius: 12px; padding: 16px; margin: 20px 0; font-size: 12px;">
                  <p style="margin: 0 0 6px 0;"><strong>Request Type:</strong> ${return_type.toUpperCase()}</p>
                  <p style="margin: 0 0 6px 0;"><strong>Reason:</strong> ${reason}</p>
                  ${exchange_size ? `<p style="margin: 0 0 6px 0;"><strong>Preferred Replacement Size:</strong> ${exchange_size}</p>` : ''}
                  ${customer_notes ? `<p style="margin: 0;"><strong>Your Note:</strong> "${customer_notes}"</p>` : ''}
                </div>

                <p style="font-size: 12px; color: #78716c; line-height: 1.5;">
                  Our concierge team will verify your request within 24 hours and assign our courier partner for complimentary doorstep pickup.
                </p>

                <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 24px 0;" />
                <p style="font-size: 11px; color: #a8a29e; text-align: center; margin: 0;">Ozeira Atelier • care@ozeira.com | +91 98765 43210</p>
              </div>
            `,
            text: `Your ${return_type} request for Order #${order_number} has been registered. Our concierge will review it within 24 hours.`,
            order_number,
          }),
        });
      } catch (mailErr) {
        console.warn('Could not dispatch return email:', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Return request successfully registered with concierge.',
    });
  } catch (err: any) {
    console.error('Returns API error:', err);
    return NextResponse.json({ error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
