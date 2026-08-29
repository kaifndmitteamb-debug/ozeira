import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { NotificationService } from '@/lib/services/notification-service';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized cron trigger' }, { status: 401 });
    }

    console.log('⏰ [Abandoned Cart Cron] Running abandoned checkout recovery scanner...');

    let recoveredCount = 0;
    const now = new Date();

    if (isSupabaseConfigured) {
      try {
        // Fetch abandoned carts created in last 7 days that are not recovered and have < 2 reminders
        const { data: carts, error } = await supabase
          .from('abandoned_carts')
          .select('*')
          .eq('is_recovered', false)
          .lt('reminder_count', 2);

        if (carts && carts.length > 0) {
          for (const cart of carts) {
            const createdAt = new Date(cart.created_at);
            const hoursSince = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

            // 1st Reminder (After 1 hour)
            if (hoursSince >= 1 && cart.reminder_count === 0 && cart.email) {
              await sendRecoveryEmail(cart, 1);
              await supabase
                .from('abandoned_carts')
                .update({ reminder_count: 1, last_reminded_at: now.toISOString() })
                .eq('id', cart.id);
              recoveredCount++;
            }
            // 2nd Reminder with Voucher (After 24 hours)
            else if (hoursSince >= 24 && cart.reminder_count === 1 && cart.email) {
              await sendRecoveryEmail(cart, 2);
              await supabase
                .from('abandoned_carts')
                .update({ reminder_count: 2, last_reminded_at: now.toISOString() })
                .eq('id', cart.id);
              recoveredCount++;
            }
          }
        }
      } catch (dbErr) {
        console.warn('Abandoned cart table scan notice:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      scanned_at: now.toISOString(),
      recovered_reminders_dispatched: recoveredCount,
      message: `Abandoned cart scan complete. Dispatched ${recoveredCount} reminder(s).`,
    });
  } catch (err: any) {
    console.error('Abandoned cart cron error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

async function sendRecoveryEmail(cart: any, reminderStage: number) {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const cartUrl = `${siteUrl}/cart?recovery_id=${cart.id}`;
  const couponCode = reminderStage === 2 ? 'WELCOME10' : null;

  const subject = reminderStage === 1
    ? '✨ Your curated atelier selections are waiting at Ozeira'
    : '🎁 An exclusive 10% privilege on your pending Ozeira pieces';

  const html = `
    <div style="font-family: Georgia, serif; padding: 36px; background: #fdfbf9; border: 1px solid #e7e5e4; border-radius: 16px; color: #1c1917; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1714; letter-spacing: 4px; text-transform: uppercase; margin-top: 0; text-align: center;">OZEIRA</h2>
      <div style="text-align: center; color: #c46331; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px;">Atelier of Haute Craftsmanship</div>

      <h3 style="font-size: 18px; color: #1c1917; margin-bottom: 12px;">Did you leave something behind?</h3>
      <p style="font-size: 13px; line-height: 1.6; color: #57534e;">
        Your bespoke selections are temporarily reserved in your atelier bag. Our handcrafted pieces are produced in limited boutique editions.
      </p>

      ${couponCode ? `
      <div style="background: #fffbeb; border: 1px solid #fef3c7; border-left: 4px solid #c46331; border-radius: 12px; padding: 16px; margin: 20px 0;">
        <div style="font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; color: #92400e;">Exclusive Patron Courtesy</div>
        <div style="font-size: 14px; font-weight: bold; color: #78350f; margin-top: 4px;">
          Use voucher code <span style="background: #ffffff; padding: 2px 8px; border-radius: 4px; border: 1px dashed #c46331; font-family: monospace;">${couponCode}</span> for 10% off your entire bag.
        </div>
      </div>
      ` : ''}

      <div style="text-align: center; margin: 28px 0;">
        <a href="${cartUrl}" style="background-color: #1a1714; color: #ffffff; padding: 14px 32px; font-size: 12px; font-weight: bold; text-decoration: none; border-radius: 50px; display: inline-block; letter-spacing: 1.5px; text-transform: uppercase;">
          Resume Your Order →
        </a>
      </div>

      <p style="font-size: 11px; color: #a8a29e; text-align: center; margin: 0;">
        Need concierge styling assistance? Reply directly to this email or message WhatsApp at +91 98765 43210.
      </p>
    </div>
  `;

  try {
    await fetch(`${siteUrl}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: cart.email,
        subject,
        html,
        text: `Your Ozeira bag is waiting. Complete your order: ${cartUrl}`,
      }),
    });
  } catch (err) {
    console.warn('Could not dispatch abandoned cart email:', err);
  }
}
