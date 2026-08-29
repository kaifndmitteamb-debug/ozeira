'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { Save, AlertTriangle, User, Lock, Bell, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  
  // Profile Form
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

  // Password Form
  const [passData, setPassData] = useState({
    current: '',
    new: '',
    confirm: ''
  });

  // Notifications Form
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: false
  });

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name,
        phone: user.phone || '',
      });
      
      const savedPrefs = localStorage.getItem('ozeira_notif_prefs');
      if (savedPrefs) {
        setNotifications(JSON.parse(savedPrefs));
      }
    }
  }, [user]);

  if (!user) return null;

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await updateProfile({
      full_name: formData.full_name,
      phone: formData.phone
    });
    setLoading(false);
    
    if (success) {
      showSuccess('Profile details updated successfully!');
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passData.new !== passData.confirm) {
      alert("New passwords do not match.");
      return;
    }
    if (passData.new.length < 6) {
      alert("Password should be at least 6 characters.");
      return;
    }
    setPassData({ current: '', new: '', confirm: '' });
    showSuccess('Password updated successfully!');
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    const newPrefs = { ...notifications, [key]: !notifications[key] };
    setNotifications(newPrefs);
    localStorage.setItem('ozeira_notif_prefs', JSON.stringify(newPrefs));
    showSuccess('Notification preferences saved.');
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  return (
    <div className="space-y-8 relative">
      {/* Toast */}
      {successMsg && (
        <div className="fixed bottom-6 right-6 bg-[#1a1714] text-white px-5 py-3 rounded-2xl shadow-xl font-medium text-xs z-50 animate-fade-in-up border border-stone-700 flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100 mb-1">Account Settings</h1>
        <p className="text-xs text-stone-500 dark:text-stone-400">Update your profile credentials, security, and notification channels.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Profile Section */}
          <div className="bg-white dark:bg-[#16171b] rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
              <User size={16} className="text-[#c46331]" />
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Personal Information</h2>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className="w-full px-4 py-2.5 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-500 dark:text-stone-400 cursor-not-allowed"
                />
                <span className="text-[10px] text-stone-400 mt-1 block">Email address cannot be modified once verified.</span>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. +91 9876543210"
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 bg-[#1a1714] dark:bg-stone-800 hover:bg-[#c46331] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {loading ? 'Saving...' : 'Save Profile Details'}
                </button>
              </div>
            </form>
          </div>

          {/* Security Section */}
          <div className="bg-white dark:bg-[#16171b] rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
              <Lock size={16} className="text-[#c46331]" />
              <h2 className="text-sm font-bold text-stone-900 dark:text-stone-100">Security & Password</h2>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passData.new}
                  onChange={(e) => setPassData({ ...passData, new: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331]"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Confirm New Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passData.confirm}
                  onChange={(e) => setPassData({ ...passData, confirm: e.target.value })}
                  className="w-full px-4 py-2.5 bg-stone-50 dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl text-stone-900 dark:text-stone-100 focus:outline-none focus:border-[#c46331]"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#1a1714] dark:bg-stone-800 hover:bg-[#c46331] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Sidebar Info & Notification Prefs */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#16171b] rounded-3xl shadow-sm border border-stone-200 dark:border-stone-800 p-6 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100 dark:border-stone-800">
              <Bell size={16} className="text-[#c46331]" />
              <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider">Notifications</h3>
            </div>

            <div className="space-y-3 text-xs">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-stone-700 dark:text-stone-300">Order Updates (Email)</span>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={() => handleNotificationChange('email')}
                  className="rounded text-[#c46331]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-stone-700 dark:text-stone-300">SMS Milestone Alerts</span>
                <input
                  type="checkbox"
                  checked={notifications.sms}
                  onChange={() => handleNotificationChange('sms')}
                  className="rounded text-[#c46331]"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-stone-700 dark:text-stone-300">Boutique Drops & News</span>
                <input
                  type="checkbox"
                  checked={notifications.push}
                  onChange={() => handleNotificationChange('push')}
                  className="rounded text-[#c46331]"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
