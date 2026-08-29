'use client';
import { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store/data-store';
import { useStore } from '@/lib/context/StoreContext';
import { Save, ShieldAlert, ShoppingBag, BarChart3, Building2, CreditCard, Truck, Receipt, Sparkles, CheckCircle2, Mail, Send, AlertCircle, Loader2 } from 'lucide-react';
import type { StoreSettings } from '@/types';
import { cn } from '@/lib/utils';

export default function StoreSettingsAdminPage() {
  const { settings, refreshData } = useStore();
  const [formData, setFormData] = useState<StoreSettings | null>(null);
  const [activeTab, setActiveTab] = useState('General');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState('mdkaif84000@gmail.com');
  const [testEmailStatus, setTestEmailStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });

  useEffect(() => {
    if (settings) {
      // Ensure new subsections have safe default objects
      setFormData({
        ...settings,
        business: settings.business || {
          legalName: '',
          tradeName: 'Ozeira Atelier',
          gstin: '',
          pan: '',
          registeredAddress: '',
          supportEmail: 'care@ozeira.com',
          supportPhone: '+91 98765 43210',
        },
        abandonedCart: settings.abandonedCart || {
          isEnabled: true,
          firstDelayHours: 1,
          secondDelayHours: 24,
          reminderCouponCode: 'WELCOME10',
          maxReminders: 2,
          emailSubject: 'Your curated pieces are waiting at Ozeira',
        },
        codFraud: settings.codFraud || {
          requireOtp: true,
          maxCodAmount: 5000,
          blockedPincodes: [],
          blockedPhones: [],
        },
        analytics: settings.analytics || {
          isEnabled: false,
          ga4MeasurementId: '',
          metaPixelId: '',
        },
        email: settings.email || {
          provider: 'gmail',
          smtpHost: 'smtp.gmail.com',
          smtpPort: 465,
          smtpUser: '',
          smtpPass: '',
          resendApiKey: '',
          fromEmail: 'care@ozeira.com',
          fromName: 'Ozeira Atelier',
        },
      });
    }
  }, [settings]);

  if (!formData) return <div className="p-8 text-stone-500">Loading settings...</div>;

  const handleSave = () => {
    DataStore.saveSettings(formData);
    refreshData();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSendTestEmail = async () => {
    if (!testEmailRecipient || !testEmailRecipient.includes('@')) {
      setTestEmailStatus({ loading: false, success: false, message: 'Please enter a valid recipient email.' });
      return;
    }

    setTestEmailStatus({ loading: true });
    try {
      // First save current form data so API reads latest credentials
      DataStore.saveSettings(formData);
      
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmailRecipient.trim(),
          subject: '✨ Ozeira Atelier - Live Email Dispatch Test',
          html: `
            <div style="font-family: Georgia, serif; padding: 24px; background: #fdfbf9; border: 1px solid #e7e5e4; border-radius: 12px; color: #1c1917;">
              <h2 style="color: #c46331; margin-top: 0;">OZEIRA ATELIER</h2>
              <p>This is a live test notification from your Ozeira luxury boutique.</p>
              <p>Your SMTP / Email dispatch pipeline is operating successfully!</p>
              <hr style="border: none; border-top: 1px solid #e7e5e4; margin: 16px 0;" />
              <p style="font-size: 11px; color: #78716c;">Ozeira Atelier • Haute Craftsmanship</p>
            </div>
          `,
          text: 'This is a test notification from Ozeira Atelier. Your SMTP pipeline is operating successfully!',
          is_test: true,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && !data.simulated) {
        setTestEmailStatus({ loading: false, success: true, message: `✅ Live email successfully delivered to ${testEmailRecipient} via ${data.provider?.toUpperCase()}!` });
      } else if (data.simulated) {
        setTestEmailStatus({ loading: false, success: false, message: `⚠️ SMTP credentials are empty or not configured. Please fill in your SMTP Password (or Gmail App Password) and click Save.` });
      } else {
        setTestEmailStatus({ loading: false, success: false, message: `❌ Dispatch failed: ${data.error || 'Connection rejected'}` });
      }
    } catch (err: any) {
      setTestEmailStatus({ loading: false, success: false, message: `❌ Network error: ${err.message}` });
    }
  };

  const tabs = [
    { id: 'General', label: 'General', icon: Building2 },
    { id: 'Email', label: 'Email & SMTP', icon: Mail },
    { id: 'Business', label: 'Business & GST', icon: Receipt },
    { id: 'COD', label: 'COD & Fraud Rules', icon: ShieldAlert },
    { id: 'AbandonedCart', label: 'Abandoned Cart', icon: ShoppingBag },
    { id: 'Analytics', label: 'Analytics & Tracking', icon: BarChart3 },
    { id: 'Shipping', label: 'Shipping Rates', icon: Truck },
    { id: 'Tax', label: 'Taxation', icon: Receipt },
    { id: 'Loyalty', label: 'Loyalty Program', icon: Sparkles },
    { id: 'Payments', label: 'Payments (Razorpay)', icon: CreditCard },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">Store Settings & Configuration</h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">Manage live business details, fraud prevention, cart recovery, and analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          {savedSuccess && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg">
              <CheckCircle2 className="w-4 h-4" /> Settings Saved!
            </span>
          )}
          <button 
            onClick={handleSave} 
            className="bg-[#1a1714] dark:bg-amber-600 hover:bg-[#c46331] text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#14151a] rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm flex flex-col md:flex-row overflow-hidden">
        {/* Tab Sidebar */}
        <div className="w-full md:w-56 border-b md:border-b-0 md:border-r border-stone-100 dark:border-stone-800 bg-stone-50/50 dark:bg-[#111217] p-3 flex flex-row md:flex-col gap-1 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isSelected = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={cn(
                  "flex items-center gap-2.5 text-left px-3.5 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                  isSelected 
                    ? "bg-[#1a1714] dark:bg-stone-800 text-white shadow-sm" 
                    : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800/60"
                )}
              >
                <Icon className={cn("w-4 h-4", isSelected ? "text-amber-400" : "text-stone-400")} />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 p-6 lg:p-8">
          {/* 1. General Details */}
          {activeTab === 'General' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Store Profile & Branding</h2>
                <p className="text-xs text-stone-500">Public store identity displayed on storefront and order headers.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Store Public Name</label>
                  <input 
                    type="text" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.general.storeName} 
                    onChange={e=>setFormData({...formData, general:{...formData.general, storeName: e.target.value}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Support Concierge Email</label>
                  <input 
                    type="email" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.general.supportEmail} 
                    onChange={e=>setFormData({...formData, general:{...formData.general, supportEmail: e.target.value}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Support Phone</label>
                  <input 
                    type="text" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.general.supportPhone} 
                    onChange={e=>setFormData({...formData, general:{...formData.general, supportPhone: e.target.value}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">WhatsApp Concierge Number</label>
                  <input 
                    type="text" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.general.whatsappNumber} 
                    onChange={e=>setFormData({...formData, general:{...formData.general, whatsappNumber: e.target.value}})} 
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Tagline</label>
                <input 
                  type="text" 
                  className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                  value={formData.general.tagline} 
                  onChange={e=>setFormData({...formData, general:{...formData.general, tagline: e.target.value}})} 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Physical Atelier / Showroom Address</label>
                <textarea 
                  className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                  rows={2} 
                  value={formData.general.supportAddress} 
                  onChange={e=>setFormData({...formData, general:{...formData.general, supportAddress: e.target.value}})} 
                />
              </div>
            </div>
          )}

          {/* Email & SMTP Dispatcher Tab */}
          {activeTab === 'Email' && (
            <div className="space-y-6 animate-fade-in">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Live Email & SMTP Dispatcher</h2>
                <p className="text-xs text-stone-500">Configure your email provider to send real order confirmations, cancellation notices, and tracking updates to customers.</p>
              </div>

              {/* Instructions Tip Box */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-xs text-amber-900 dark:text-amber-300 space-y-2">
                <div className="font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>How to setup live customer email dispatch:</span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-amber-800 dark:text-amber-300/90">
                  <li><strong>Gmail / Google Workspace:</strong> Set SMTP Host to <code>smtp.gmail.com</code>, Port <code>465</code>, your Gmail address as SMTP User, and generate a 16-character <em>App Password</em> (Google Account → Security → 2-Step Verification → App Passwords).</li>
                  <li><strong>Custom SMTP / Hostinger / Brevo / AWS SES:</strong> Enter your custom SMTP Host, Port (465 SSL or 587 TLS), User, and Password.</li>
                  <li><strong>Resend API:</strong> Alternatively, enter your Resend API Key (<code>re_...</code>).</li>
                </ul>
              </div>

              {/* Provider Selection */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Email Delivery Provider</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { id: 'supabase', label: '⚡ Direct Supabase' },
                      { id: 'gmail', label: 'Gmail (App Password)' },
                      { id: 'smtp', label: 'Custom SMTP' },
                      { id: 'resend', label: 'Resend API' },
                    ].map((p) => {
                      const isSelected = (formData.email?.provider || 'supabase') === p.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFormData({
                            ...formData,
                            email: {
                              ...formData.email,
                              provider: p.id as any,
                              smtpHost: p.id === 'gmail' ? 'smtp.gmail.com' : (formData.email?.smtpHost || ''),
                              smtpPort: p.id === 'gmail' ? 465 : (formData.email?.smtpPort || 587),
                            }
                          })}
                          className={cn(
                            "py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-center",
                            isSelected 
                              ? "border-amber-600 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 shadow-xs" 
                              : "border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400 hover:border-stone-300"
                          )}
                        >
                          {p.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Direct Supabase Mode Active Card */}
                {(formData.email?.provider === 'supabase' || !formData.email?.provider) && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-xs text-emerald-900 dark:text-emerald-300 space-y-1.5 animate-fade-in">
                    <div className="font-bold flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Direct Supabase Email Pipeline Connected</span>
                    </div>
                    <p className="text-[11px] text-emerald-800/90 dark:text-emerald-400/90">
                      Emails dispatch directly through your live Supabase Edge Function (<code>send-email</code> on project <code>rgqzcjrduahsdkmqfuvr</code>) and sync automatically with the Supabase <code>notification_logs</code> table.
                    </p>
                  </div>
                )}

                {/* SMTP Credentials Form */}
                {formData.email?.provider !== 'resend' && formData.email?.provider !== 'supabase' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">SMTP Host</label>
                      <input 
                        type="text" 
                        placeholder="smtp.gmail.com"
                        className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                        value={formData.email?.smtpHost || ''} 
                        onChange={e => setFormData({
                          ...formData, 
                          email: { ...(formData.email || {}), smtpHost: e.target.value }
                        })} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">SMTP Port (465 for SSL, 587 for TLS)</label>
                      <input 
                        type="number" 
                        placeholder="465"
                        className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                        value={formData.email?.smtpPort || 465} 
                        onChange={e => setFormData({
                          ...formData, 
                          email: { ...(formData.email || {}), smtpPort: Number(e.target.value) }
                        })} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">SMTP Username / Email Address *</label>
                      <input 
                        type="email" 
                        placeholder="mdkaif84000@gmail.com"
                        className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                        value={formData.email?.smtpUser || ''} 
                        onChange={e => setFormData({
                          ...formData, 
                          email: { ...(formData.email || {}), smtpUser: e.target.value }
                        })} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">SMTP Password / Gmail App Password *</label>
                      <input 
                        type="password" 
                        placeholder="••••••••••••••••"
                        className="w-full text-xs font-mono border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                        value={formData.email?.smtpPass || ''} 
                        onChange={e => setFormData({
                          ...formData, 
                          email: { ...(formData.email || {}), smtpPass: e.target.value }
                        })} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Sender Display Name</label>
                      <input 
                        type="text" 
                        placeholder="Ozeira Atelier"
                        className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                        value={formData.email?.fromName || 'Ozeira Atelier'} 
                        onChange={e => setFormData({
                          ...formData, 
                          email: { ...(formData.email || {}), fromName: e.target.value }
                        })} 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Reply-To Email Address</label>
                      <input 
                        type="email" 
                        placeholder="care@ozeira.com"
                        className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                        value={formData.email?.fromEmail || 'care@ozeira.com'} 
                        onChange={e => setFormData({
                          ...formData, 
                          email: { ...(formData.email || {}), fromEmail: e.target.value }
                        })} 
                      />
                    </div>
                  </div>
                )}

                {/* Resend API Key */}
                {formData.email?.provider === 'resend' && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Resend API Key (starts with re_)</label>
                      <input 
                        type="password" 
                        placeholder="re_1234567890..."
                        className="w-full text-xs font-mono border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                        value={formData.email?.resendApiKey || ''} 
                        onChange={e => setFormData({
                          ...formData, 
                          email: { ...(formData.email || {}), resendApiKey: e.target.value }
                        })} 
                      />
                    </div>
                  </div>
                )}

                {/* Live Test Dispatcher Card */}
                <div className="mt-8 pt-6 border-t border-stone-200 dark:border-stone-800 bg-stone-50/70 dark:bg-stone-900/60 p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                        <Send className="w-3.5 h-3.5 text-amber-600" /> Send Live Test Email
                      </h3>
                      <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-0.5">
                        Test your credentials and receive an immediate sample verification email in your inbox.
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <input 
                      type="email" 
                      placeholder="Enter recipient email (e.g. mdkaif84000@gmail.com)"
                      className="w-full sm:flex-1 text-xs border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-950 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                      value={testEmailRecipient} 
                      onChange={e => setTestEmailRecipient(e.target.value)} 
                    />
                    <button 
                      type="button"
                      disabled={testEmailStatus.loading}
                      onClick={handleSendTestEmail}
                      className="w-full sm:w-auto bg-[#c46331] hover:bg-[#a34c28] text-white px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 whitespace-nowrap"
                    >
                      {testEmailStatus.loading ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Dispatching...
                        </>
                      ) : (
                        <>
                          <Mail className="w-3.5 h-3.5" /> Test Dispatch
                        </>
                      )}
                    </button>
                  </div>

                  {testEmailStatus.message && (
                    <div className={cn(
                      "p-3 rounded-xl text-xs flex items-start gap-2",
                      testEmailStatus.success 
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50" 
                        : "bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50"
                    )}>
                      {testEmailStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />}
                      <span>{testEmailStatus.message}</span>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

          {/* 3. Business & GST (Requirement 1) */}
          {activeTab === 'Business' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Business & GST Invoicing Details</h2>
                <p className="text-xs text-stone-500">These details automatically populate onto customer PDF invoices and receipts. Safe to leave blank if not registered yet.</p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 text-xs text-amber-800 dark:text-amber-300">
                💡 If left blank, order invoices generate with default luxury branding without requiring statutory tax registration fields.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Registered Legal Entity Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ozeira Luxury Enterprises Pvt Ltd"
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.business?.legalName || ''} 
                    onChange={e=>setFormData({...formData, business:{...formData.business, legalName: e.target.value}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Trade / Brand Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ozeira Atelier"
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.business?.tradeName || ''} 
                    onChange={e=>setFormData({...formData, business:{...formData.business, tradeName: e.target.value}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">GSTIN Number (15-Digit)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 27AAAAA0000A1Z5"
                    className="w-full text-xs font-mono uppercase border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.business?.gstin || ''} 
                    onChange={e=>setFormData({...formData, business:{...formData.business, gstin: e.target.value}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Business PAN Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. ABCDE1234F"
                    className="w-full text-xs font-mono uppercase border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.business?.pan || ''} 
                    onChange={e=>setFormData({...formData, business:{...formData.business, pan: e.target.value}})} 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Registered Office Address</label>
                <textarea 
                  className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                  rows={2} 
                  placeholder="Official registered company address printed on invoices..."
                  value={formData.business?.registeredAddress || ''} 
                  onChange={e=>setFormData({...formData, business:{...formData.business, registeredAddress: e.target.value}})} 
                />
              </div>
            </div>
          )}

          {/* 3. COD Fraud Rules (Requirement 3) */}
          {activeTab === 'COD' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Cash on Delivery & Fraud Protection</h2>
                <p className="text-xs text-stone-500">Prevent return-to-origin (RTO) losses with OTP phone verification, maximum order caps, and pincode blacklists.</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded text-amber-600"
                    checked={formData.cod.isEnabled} 
                    onChange={e=>setFormData({...formData, cod:{...formData.cod, isEnabled: e.target.checked}})} 
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">Enable Cash on Delivery</span>
                    <span className="text-[11px] text-stone-500">Allow customers to pay in cash upon courier delivery.</span>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded text-amber-600"
                    checked={formData.codFraud?.requireOtp ?? true} 
                    onChange={e=>setFormData({...formData, codFraud:{...formData.codFraud, requireOtp: e.target.checked}})} 
                  />
                  <div>
                    <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">Require OTP Verification for COD (High Fraud Protection)</span>
                    <span className="text-[11px] text-stone-500">Sends a 6-digit SMS OTP verification code to the customer's phone at checkout before confirming a COD order.</span>
                  </div>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2.5">
                  <label className="block text-xs font-bold text-stone-900 dark:text-stone-100">
                    Maximum Allowed COD Order Value (₹)
                  </label>
                  <input 
                    type="number" 
                    className="w-full text-xs font-bold font-mono border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-xl p-2.5 text-stone-900 dark:text-stone-100 focus:border-[#c46331] outline-none" 
                    value={formData.codFraud?.maxCodAmount ?? 5000} 
                    onChange={e=>setFormData({...formData, codFraud:{...formData.codFraud, maxCodAmount: Number(e.target.value)}})} 
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[5000, 10000, 25000, 50000, 100000, 999999].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setFormData({...formData, codFraud:{...formData.codFraud, maxCodAmount: amt}})}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer",
                          (formData.codFraud?.maxCodAmount ?? 5000) === amt
                            ? "bg-[#1a1714] dark:bg-amber-600 text-white"
                            : "bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-[#c46331]"
                        )}
                      >
                        {amt === 999999 ? 'No Cap (Unlimited)' : `₹${amt.toLocaleString()}`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-500">
                    Orders above this amount must pay online via Card/UPI. Set to <strong>No Cap</strong> to allow COD for any price.
                  </p>
                </div>

                <div className="p-4 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2.5">
                  <label className="block text-xs font-bold text-stone-900 dark:text-stone-100">
                    COD Handling Surcharge (₹)
                  </label>
                  <input 
                    type="number" 
                    className="w-full text-xs font-bold font-mono border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800 rounded-xl p-2.5 text-stone-900 dark:text-stone-100 focus:border-[#c46331] outline-none" 
                    value={formData.cod.handlingFee} 
                    onChange={e=>setFormData({...formData, cod:{...formData.cod, handlingFee: Number(e.target.value)}})} 
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[0, 49, 99, 149, 199].map((fee) => (
                      <button
                        key={fee}
                        type="button"
                        onClick={() => setFormData({...formData, cod:{...formData.cod, handlingFee: fee}})}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer",
                          formData.cod.handlingFee === fee
                            ? "bg-[#1a1714] dark:bg-amber-600 text-white"
                            : "bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:border-[#c46331]"
                        )}
                      >
                        {fee === 0 ? 'Free (₹0)' : `+₹${fee}`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-stone-500">Convenience handling fee automatically added to the customer's total at checkout.</p>
                </div>
              </div>

              {/* Customer Warning Preview */}
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-900 dark:text-amber-300 text-[11px] uppercase tracking-wider block">
                  Customer Checkout Preview:
                </span>
                <p className="text-amber-800 dark:text-amber-400 text-[11px] italic">
                  {(formData.codFraud?.maxCodAmount ?? 5000) >= 999999
                    ? "✨ Cash on Delivery is enabled for all order amounts."
                    : `⚠️ "Cash on Delivery is limited to orders up to ₹${(formData.codFraud?.maxCodAmount ?? 5000).toLocaleString()} to protect against transit loss. Please select Online Payment."`}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Blocked High-RTO Pincodes (Comma-separated)</label>
                <textarea 
                  className="w-full text-xs font-mono border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                  rows={2} 
                  placeholder="e.g. 110006, 400008, 700001 (Leave empty to allow all eligible areas)"
                  value={(formData.codFraud?.blockedPincodes || []).join(', ')} 
                  onChange={e=>setFormData({...formData, codFraud:{...formData.codFraud, blockedPincodes: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)}})} 
                />
              </div>
            </div>
          )}

          {/* 4. Abandoned Cart Recovery (Requirement 2) */}
          {activeTab === 'AbandonedCart' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Automated Abandoned Cart Recovery</h2>
                <p className="text-xs text-stone-500">Automatically re-engage shoppers who add luxury pieces to cart and drop off at checkout.</p>
              </div>

              <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded text-amber-600"
                  checked={formData.abandonedCart?.isEnabled ?? true} 
                  onChange={e=>setFormData({...formData, abandonedCart:{...formData.abandonedCart, isEnabled: e.target.checked}})} 
                />
                <div>
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">Enable Automated Abandoned Cart Recovery</span>
                  <span className="text-[11px] text-stone-500">Sends up to 2 gentle reminder emails with cart contents and 1-click checkout recovery link.</span>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">1st Reminder Timing (Hours after drop-off)</label>
                  <input 
                    type="number" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.abandonedCart?.firstDelayHours ?? 1} 
                    onChange={e=>setFormData({...formData, abandonedCart:{...formData.abandonedCart, firstDelayHours: Number(e.target.value)}})} 
                  />
                  <p className="text-[11px] text-stone-500 mt-1">Recommended: 1 hour (highest conversion rate).</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">2nd Reminder Timing (Hours after drop-off)</label>
                  <input 
                    type="number" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.abandonedCart?.secondDelayHours ?? 24} 
                    onChange={e=>setFormData({...formData, abandonedCart:{...formData.abandonedCart, secondDelayHours: Number(e.target.value)}})} 
                  />
                  <p className="text-[11px] text-stone-500 mt-1">Recommended: 24 hours.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Incentive Discount Coupon (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. WELCOME10"
                    className="w-full text-xs uppercase font-mono border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.abandonedCart?.reminderCouponCode || ''} 
                    onChange={e=>setFormData({...formData, abandonedCart:{...formData.abandonedCart, reminderCouponCode: e.target.value}})} 
                  />
                  <p className="text-[11px] text-stone-500 mt-1">Automatically applied in the recovery link button.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Email Subject Line</label>
                  <input 
                    type="text" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.abandonedCart?.emailSubject || 'Your curated pieces are waiting at Ozeira'} 
                    onChange={e=>setFormData({...formData, abandonedCart:{...formData.abandonedCart, emailSubject: e.target.value}})} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* 5. Analytics & Tracking (Requirement 4) */}
          {activeTab === 'Analytics' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Analytics & Conversion Tracking (GA4 + Meta Pixel)</h2>
                <p className="text-xs text-stone-500">Track page views, product views, add-to-bag, and checkout conversions without code editing.</p>
              </div>

              <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded text-amber-600"
                  checked={formData.analytics?.isEnabled ?? false} 
                  onChange={e=>setFormData({...formData, analytics:{...formData.analytics, isEnabled: e.target.checked}})} 
                />
                <div>
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100 block">Enable E-Commerce Tracking Scripts</span>
                  <span className="text-[11px] text-stone-500">Only injects tracking pixels when valid Measurement IDs are provided below. Safe and zero console errors when empty.</span>
                </div>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Google Analytics 4 Measurement ID</label>
                  <input 
                    type="text" 
                    placeholder="G-XXXXXXXXXX"
                    className="w-full text-xs font-mono border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.analytics?.ga4MeasurementId || ''} 
                    onChange={e=>setFormData({...formData, analytics:{...formData.analytics, ga4MeasurementId: e.target.value}})} 
                  />
                  <p className="text-[11px] text-stone-500 mt-1">From your Google Analytics Admin ➔ Data Streams ➔ Measurement ID.</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Meta (Facebook) Pixel ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 123456789012345"
                    className="w-full text-xs font-mono border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.analytics?.metaPixelId || ''} 
                    onChange={e=>setFormData({...formData, analytics:{...formData.analytics, metaPixelId: e.target.value}})} 
                  />
                  <p className="text-[11px] text-stone-500 mt-1">From Meta Events Manager ➔ Pixel / Dataset ID.</p>
                </div>
              </div>
            </div>
          )}

          {/* 6. Shipping Rates */}
          {activeTab === 'Shipping' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Shipping & Delivery Rates</h2>
                <p className="text-xs text-stone-500">Configure thresholds and fees calculated automatically during checkout.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Free Shipping Threshold (₹)</label>
                  <input 
                    type="number" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.shipping.freeShippingThreshold} 
                    onChange={e=>setFormData({...formData, shipping:{...formData.shipping, freeShippingThreshold: Number(e.target.value)}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Standard Delivery Fee (₹)</label>
                  <input 
                    type="number" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.shipping.standardShippingFee} 
                    onChange={e=>setFormData({...formData, shipping:{...formData.shipping, standardShippingFee: Number(e.target.value)}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Express Air Delivery Fee (₹)</label>
                  <input 
                    type="number" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.shipping.expressShippingFee} 
                    onChange={e=>setFormData({...formData, shipping:{...formData.shipping, expressShippingFee: Number(e.target.value)}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Estimated Standard Delivery Window</label>
                  <input 
                    type="text" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.shipping.estimatedStandardDays} 
                    onChange={e=>setFormData({...formData, shipping:{...formData.shipping, estimatedStandardDays: e.target.value}})} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* 7. Tax Configuration */}
          {activeTab === 'Tax' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Tax & GST Rate</h2>
                <p className="text-xs text-stone-500">Configure statutory GST rates applied on checkout line items.</p>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded text-amber-600"
                    checked={formData.tax.isEnabled} 
                    onChange={e=>setFormData({...formData, tax:{...formData.tax, isEnabled: e.target.checked}})} 
                  />
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100">Enable Tax Calculation</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded text-amber-600"
                    checked={formData.tax.inclusiveInPrice} 
                    onChange={e=>setFormData({...formData, tax:{...formData.tax, inclusiveInPrice: e.target.checked}})} 
                  />
                  <span className="text-xs font-bold text-stone-900 dark:text-stone-100">Product catalog prices are already inclusive of GST</span>
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Tax Percentage (%)</label>
                  <input 
                    type="number" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.tax.percentage} 
                    onChange={e=>setFormData({...formData, tax:{...formData.tax, percentage: Number(e.target.value)}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">GSTIN Tax ID</label>
                  <input 
                    type="text" 
                    className="w-full text-xs font-mono uppercase border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.tax.gstinNumber} 
                    onChange={e=>setFormData({...formData, tax:{...formData.tax, gstinNumber: e.target.value}})} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* 8. Loyalty Program */}
          {activeTab === 'Loyalty' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Loyalty Rewards & Points Program</h2>
                <p className="text-xs text-stone-500">Incentivize patron retention with cashback points and bonuses.</p>
              </div>
              <label className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded text-amber-600"
                  checked={formData.loyalty.isEnabled} 
                  onChange={e=>setFormData({...formData, loyalty:{...formData.loyalty, isEnabled: e.target.checked}})} 
                />
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100">Enable Ozeira Loyalty Wallet</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Points Earned per ₹1 Spent</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.loyalty.pointsPerRupeeSpent} 
                    onChange={e=>setFormData({...formData, loyalty:{...formData.loyalty, pointsPerRupeeSpent: Number(e.target.value)}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">₹ Redemption Value per Point</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.loyalty.pointsToRupeeRate} 
                    onChange={e=>setFormData({...formData, loyalty:{...formData.loyalty, pointsToRupeeRate: Number(e.target.value)}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Signup Welcome Bonus (Points)</label>
                  <input 
                    type="number" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.loyalty.signupBonusPoints} 
                    onChange={e=>setFormData({...formData, loyalty:{...formData.loyalty, signupBonusPoints: Number(e.target.value)}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Verified Review Reward (Points)</label>
                  <input 
                    type="number" 
                    className="w-full text-xs border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.loyalty.reviewBonusPoints} 
                    onChange={e=>setFormData({...formData, loyalty:{...formData.loyalty, reviewBonusPoints: Number(e.target.value)}})} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* 9. Payment Gateway */}
          {activeTab === 'Payments' && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-stone-100 dark:border-stone-800 pb-3">
                <h2 className="text-base font-bold text-stone-900 dark:text-stone-100">Payment Gateway (Razorpay API Keys)</h2>
                <p className="text-xs text-stone-500">Keys are stored securely and used to process Card, UPI, and Netbanking payments.</p>
              </div>
              <label className="flex items-center gap-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-4 h-4 rounded text-amber-600"
                  checked={formData.payments.isTestMode} 
                  onChange={e=>setFormData({...formData, payments:{...formData.payments, isTestMode: e.target.checked}})} 
                />
                <div>
                  <span className="text-xs font-bold text-amber-900 dark:text-amber-300 block">Razorpay Test Mode Active</span>
                  <span className="text-[11px] text-amber-700 dark:text-amber-400">Uncheck when you are ready to process live customer credit cards & UPI.</span>
                </div>
              </label>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Razorpay Key ID</label>
                  <input 
                    type="text" 
                    className="w-full text-xs font-mono border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.payments.razorpayKeyId} 
                    onChange={e=>setFormData({...formData, payments:{...formData.payments, razorpayKeyId: e.target.value}})} 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Razorpay Key Secret</label>
                  <input 
                    type="password" 
                    placeholder="••••••••••••••••••••"
                    className="w-full text-xs font-mono border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-900 rounded-xl p-2.5 text-stone-900 dark:text-stone-100" 
                    value={formData.payments.razorpayKeySecret} 
                    onChange={e=>setFormData({...formData, payments:{...formData.payments, razorpayKeySecret: e.target.value}})} 
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
