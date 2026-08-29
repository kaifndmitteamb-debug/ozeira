'use client';

import React, { useState } from 'react';
import { useStore } from '@/lib/context/StoreContext';
import { MapPin, Phone, Mail, Clock, Instagram, Twitter, Youtube, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import Link from 'next/link';

export default function ContactPage() {
  const { submitContactForm, settings } = useStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: ''
  });
  const [status, setStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      const result = submitContactForm(formData);
      setStatus(result);
      setLoading(false);
      if (result.success) {
        setFormData({ name: '', email: '', phone: '', subject: 'General Inquiry', message: '' });
      }
    }, 400);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="bg-stone-50 dark:bg-[#0f1014] min-h-screen pb-20 transition-colors">
      <div className="bg-white dark:bg-[#16171b] py-16 text-center px-4 border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-2xl mx-auto space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-[#c46331] mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 dark:text-stone-100">
            Atelier Concierge & Support
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
            Our styling advisors and customer care specialists are at your service for bespoke inquiries, orders, and sizing advice.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Contact Details & Direct Channels */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white dark:bg-[#16171b] p-8 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
              <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                Direct Channels
              </h2>
              
              <div className="space-y-5 text-xs">
                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-[#c46331] flex-shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 dark:text-stone-100">Email Inquiries</h4>
                    <p className="text-stone-500 dark:text-stone-400 mt-0.5">{settings?.general?.supportEmail || 'care@ozeira.com'}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">Average response: Under 2 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-[#c46331] flex-shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 dark:text-stone-100">Telephone / WhatsApp</h4>
                    <p className="text-stone-500 dark:text-stone-400 mt-0.5">{settings?.general?.supportPhone || '+91 98765 43210'}</p>
                    <p className="text-[10px] text-stone-400 mt-0.5">Mon – Sat, 10:00 AM – 8:00 PM IST</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-[#c46331] flex-shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 dark:text-stone-100">Head Atelier</h4>
                    <p className="text-stone-500 dark:text-stone-400 mt-0.5">{settings?.general?.supportAddress || '42 Heritage Blvd, Bandra West, Mumbai 400050'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3.5">
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/50 rounded-xl text-[#c46331] flex-shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900 dark:text-stone-100">Operating Hours</h4>
                    <p className="text-stone-500 dark:text-stone-400 mt-0.5">Monday – Saturday: 10:00 AM – 8:00 PM</p>
                    <p className="text-stone-500 dark:text-stone-400">Sunday: Closed for artisanal restoration</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-100 dark:border-stone-800">
                <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 mb-3">Connect on Social</h4>
                <div className="flex items-center gap-3">
                  <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-stone-100 dark:bg-stone-800 hover:bg-[#c46331] text-stone-700 dark:text-stone-300 hover:text-white rounded-full transition-colors" aria-label="Instagram">
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-stone-100 dark:bg-stone-800 hover:bg-[#c46331] text-stone-700 dark:text-stone-300 hover:text-white rounded-full transition-colors" aria-label="Twitter / X">
                    <Twitter className="w-4 h-4" />
                  </a>
                  <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="p-2 bg-stone-100 dark:bg-stone-800 hover:bg-[#c46331] text-stone-700 dark:text-stone-300 hover:text-white rounded-full transition-colors" aria-label="YouTube">
                    <Youtube className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-white dark:bg-[#16171b] p-8 sm:p-10 rounded-3xl border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-serif font-bold text-stone-900 dark:text-stone-100">
                  Send a Message to the Atelier
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                  Fill in your details and our team will get back to you promptly.
                </p>
              </div>

              {status && (
                <div className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 ${status.success ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'}`}>
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{status.message}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Full Name <span className="text-rose-500">*</span></label>
                    <input 
                      type="text" 
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Kavya Sharma"
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Email Address <span className="text-rose-500">*</span></label>
                    <input 
                      type="email" 
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="kavya@example.com"
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Contact Phone</label>
                    <input 
                      type="tel" 
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+91 98765 43210"
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Topic / Subject</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331]"
                    >
                      <option value="General Inquiry">General Inquiry</option>
                      <option value="Order Tracking">Order Tracking & Delivery</option>
                      <option value="Custom Sizing / Bespoke">Custom Sizing / Bespoke Request</option>
                      <option value="Returns & Exchanges">Returns & Exchanges</option>
                      <option value="Wholesale / Press">Wholesale / Press Collaboration</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 dark:text-stone-300 mb-1">Message <span className="text-rose-500">*</span></label>
                  <textarea 
                    name="message"
                    rows={5}
                    required
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="How may our concierge assist you today?"
                    className="w-full px-3.5 py-2.5 text-xs bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-[#1a1714] hover:bg-[#c46331] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{loading ? 'Transmitting Message...' : 'Send Message to Concierge'}</span>
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
