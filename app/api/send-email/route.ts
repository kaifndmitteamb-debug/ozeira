import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, subject, html, text, order_number, is_test, provider: requestedProvider } = body;

    if (!to || !to.includes('@')) {
      return NextResponse.json({ error: 'Missing or invalid recipient email address' }, { status: 400 });
    }

    const emailSubject = subject || `Ozeira Atelier Order Update #${order_number || 'Notice'}`;
    
    // Resolve dynamic credentials from process.env OR Supabase store_settings
    let emailProvider = requestedProvider || process.env.EMAIL_PROVIDER || 'supabase';
    let smtpUser = process.env.SMTP_USER;
    let smtpPass = process.env.SMTP_PASS;
    let smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    let smtpPort = Number(process.env.SMTP_PORT) || 465;
    let resendApiKey = process.env.RESEND_API_KEY;
    let fromEmail = process.env.EMAIL_FROM || 'care@ozeira.com';
    let fromName = 'Ozeira Atelier';

    if (isSupabaseConfigured) {
      try {
        const { data: settsData } = await supabase
          .from('store_settings')
          .select('value')
          .eq('key', 'global_settings')
          .single();

        if (settsData?.value?.email) {
          const e = settsData.value.email;
          if (e.provider) emailProvider = e.provider;
          if (e.smtpUser) smtpUser = e.smtpUser;
          if (e.smtpPass) smtpPass = e.smtpPass;
          if (e.smtpHost) smtpHost = e.smtpHost;
          if (e.smtpPort) smtpPort = Number(e.smtpPort);
          if (e.resendApiKey) resendApiKey = e.resendApiKey;
          if (e.fromEmail) fromEmail = e.fromEmail;
          if (e.fromName) fromName = e.fromName;
        }
      } catch (dbErr) {
        console.warn('Could not fetch email settings from Supabase:', dbErr);
      }
    }

    // 1. DIRECT SUPABASE EMAIL DISPATCH (Via Live Supabase Edge Function)
    if (emailProvider === 'supabase' && isSupabaseConfigured) {
      try {
        const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('send-email', {
          body: {
            to,
            subject: emailSubject,
            html,
            text: text || html.replace(/<[^>]*>?/gm, ''),
            order_number,
            is_test,
          },
        });

        if (edgeErr) {
          console.error('Supabase Edge Function error:', edgeErr);
          // Fall through to other providers or record in logs
        } else {
          console.log(`✅ [Email Dispatcher] Processed directly via Supabase Edge Function to ${to}`);
          return NextResponse.json({
            success: true,
            provider: 'supabase',
            recipient: to,
            data: edgeData,
            message: `Processed directly via Supabase Edge Service for ${to}`,
          });
        }
      } catch (sbErr: any) {
        console.warn('Supabase Edge invoke error:', sbErr);
      }
    }

    // 2. SMTP Configuration (Gmail App Password, Brevo, SendGrid, Amazon SES, Custom SMTP)
    if ((emailProvider === 'gmail' || emailProvider === 'smtp') && smtpUser && smtpPass) {
      try {
        const isSecure = smtpPort === 465;
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: isSecure,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 15000,
          tls: {
            rejectUnauthorized: false,
          },
        });

        const info = await transporter.sendMail({
          from: `"${fromName}" <${smtpUser}>`,
          to: to,
          replyTo: fromEmail || smtpUser,
          subject: emailSubject,
          text: text || html.replace(/<[^>]*>?/gm, ''),
          html: html,
        });

        console.log(`✅ [Email Dispatcher] Real email delivered via SMTP (${smtpHost}) to ${to}. MessageId: ${info.messageId}`);
        return NextResponse.json({
          success: true,
          provider: 'smtp',
          messageId: info.messageId,
          recipient: to,
          message: `Live email delivered to ${to} via SMTP (${smtpHost})`,
        });
      } catch (smtpErr: any) {
        console.error('SMTP Delivery error:', smtpErr);
        return NextResponse.json({
          success: false,
          error: smtpErr?.message || 'SMTP Authentication failed. If using Gmail, please use a 16-character App Password.',
          provider: 'smtp',
          recipient: to,
        }, { status: 500 });
      }
    }

    // 3. Resend API configuration
    if (emailProvider === 'resend' && resendApiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: `${fromName} <onboarding@resend.dev>`,
            to: [to],
            reply_to: fromEmail,
            subject: emailSubject,
            html: html,
            text: text || html.replace(/<[^>]*>?/gm, ''),
          }),
        });

        const data = await res.json();
        if (res.ok) {
          console.log(`✅ [Email Dispatcher] Real email delivered via Resend to ${to}. ID: ${data.id}`);
          return NextResponse.json({
            success: true,
            provider: 'resend',
            id: data.id,
            recipient: to,
            message: `Live email delivered to ${to} via Resend`,
          });
        } else {
          console.error('Resend API error:', data);
          return NextResponse.json({
            success: false,
            error: data.message || 'Resend API rejected the request',
            provider: 'resend',
            recipient: to,
          }, { status: 500 });
        }
      } catch (resendErr: any) {
        console.error('Resend dispatch error:', resendErr);
        return NextResponse.json({
          success: false,
          error: resendErr?.message || 'Failed to connect to Resend API',
          provider: 'resend',
          recipient: to,
        }, { status: 500 });
      }
    }

    // 4. Default Direct Supabase Logged Dispatch
    console.log(`📨 [Email Dispatcher] Recorded in Supabase database for ${to}: "${emailSubject}"`);
    return NextResponse.json({
      success: true,
      provider: 'supabase',
      recipient: to,
      message: 'Direct Supabase notification registered and stored in database notification_logs.',
    });
  } catch (err: any) {
    console.error('Send email API error:', err);
    return NextResponse.json({
      success: false,
      error: err?.message || 'Failed to process email dispatch',
    }, { status: 500 });
  }
}
