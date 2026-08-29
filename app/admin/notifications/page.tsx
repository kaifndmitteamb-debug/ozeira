'use client';

import { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store/data-store';
import { useStore } from '@/lib/context/StoreContext';
import { formatDateTime, cn } from '@/lib/utils';
import { Mail, Smartphone, Bell, Save, Activity } from 'lucide-react';

export default function NotificationsAdminPage() {
  const { settings, refreshData } = useStore();
  const [logs, setLogs] = useState<any[]>([]);
  const [restock, setRestock] = useState<any[]>([]);
  const [subs, setSubs] = useState<any[]>([]);
  const [notifSettings, setNotifSettings] = useState(settings.notifications);
  
  const [filterChan, setFilterChan] = useState('all');
  const [filterStat, setFilterStat] = useState('all');

  useEffect(() => {
    setLogs(DataStore.getNotificationLogs());
    setRestock(DataStore.getRestockRequests());
    setSubs(DataStore.getSubscribers());
    setNotifSettings(settings.notifications);
  }, [settings]);

  const filteredLogs = logs.filter(l => {
    if (filterChan !== 'all' && l.channel !== filterChan) return false;
    if (filterStat !== 'all' && l.status !== filterStat) return false;
    return true;
  });

  const handleSaveSettings = () => {
    const updated = { ...settings, notifications: notifSettings };
    DataStore.saveSettings(updated);
    refreshData();
    alert('Notification settings saved!');
  };

  const getIcon = (channel: string) => {
    if (channel === 'email') return <Mail className="w-3.5 h-3.5 text-blue-500" />;
    if (channel === 'sms') return <Smartphone className="w-3.5 h-3.5 text-emerald-500" />;
    return <Bell className="w-3.5 h-3.5 text-brand-amber" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Communications & Dispatch Logs</h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Audit multi-channel dispatch logs, subscribers, and event triggers.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#14151a] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">Notification Logs</h2>
              <div className="flex gap-2">
                <select className="border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs rounded-lg p-1.5 outline-none focus:border-brand-amber" value={filterChan} onChange={e=>setFilterChan(e.target.value)}>
                  <option value="all">All Channels</option><option value="email">Email</option><option value="sms">SMS</option>
                </select>
                <select className="border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 text-xs rounded-lg p-1.5 outline-none focus:border-brand-amber" value={filterStat} onChange={e=>setFilterStat(e.target.value)}>
                  <option value="all">All Status</option><option value="sent">Sent</option><option value="delivered">Delivered</option><option value="failed">Failed</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-500 dark:text-neutral-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Channel</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">Content</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {filteredLogs.map(l => (
                    <tr key={l.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                      <td className="py-3 px-4 capitalize flex items-center gap-2 font-medium text-neutral-900 dark:text-neutral-100">{getIcon(l.channel)} {l.channel}</td>
                      <td className="py-3 px-4 truncate max-w-[150px] text-neutral-600 dark:text-neutral-400">{l.recipient}</td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono rounded px-2 py-0.5">{l.eventType || l.event_type}</span>
                      </td>
                      <td className="py-3 px-4 truncate max-w-[200px] text-neutral-600 dark:text-neutral-400" title={l.content}>{l.content}</td>
                      <td className="py-3 px-4 text-neutral-400 whitespace-nowrap">{formatDateTime(l.timestamp || l.created_at)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={cn("px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize", l.status==='sent' ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300' : l.status==='delivered' ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300' : 'bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-300')}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && <tr><td colSpan={6} className="text-center py-6 text-neutral-500 dark:text-neutral-400">No logs found in dispatch ledger.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-[#14151a] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm text-xs">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-brand-amber"/> Waitlist & Restock Requests</h2>
              <ul className="space-y-3 divide-y divide-neutral-100 dark:divide-neutral-800">
                {restock.map(r => (
                  <li key={r.id} className="pt-2">
                    <p className="font-semibold text-neutral-900 dark:text-neutral-100">{r.email}</p>
                    <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">Product ID: {r.productId}</p>
                    <p className="text-[10px] text-neutral-400">{formatDateTime(r.createdAt)}</p>
                  </li>
                ))}
                {restock.length === 0 && <p className="text-neutral-500 dark:text-neutral-400 py-4">No requests pending.</p>}
              </ul>
            </div>
            <div className="bg-white dark:bg-[#14151a] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm text-xs">
              <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4">Newsletter Patrons ({subs.length})</h2>
              <ul className="space-y-2 divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[300px] overflow-y-auto">
                {subs.map(s => (
                  <li key={s.id} className="pt-2 flex justify-between items-center">
                    <span className="font-medium text-neutral-800 dark:text-neutral-200">{s.email}</span>
                    <span className={s.is_active ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-red-500"}>{s.is_active ? 'Active' : 'Unsub'}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-[#14151a] p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-sm text-xs">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">Global Settings</h2>
            <button onClick={handleSaveSettings} className="bg-brand-amber hover:bg-brand-amber-dark text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors">
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3 border-b border-neutral-100 dark:border-neutral-800 pb-1">Channels</h3>
              <div className="space-y-2 text-neutral-700 dark:text-neutral-300">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded text-brand-amber focus:ring-brand-amber accent-brand-amber" checked={notifSettings?.emailEnabled} onChange={e=>setNotifSettings({...notifSettings, emailEnabled: e.target.checked})} />
                  Enable Email Dispatch
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded text-brand-amber focus:ring-brand-amber accent-brand-amber" checked={notifSettings?.smsEnabled} onChange={e=>setNotifSettings({...notifSettings, smsEnabled: e.target.checked})} />
                  Enable SMS Dispatch
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded text-brand-amber focus:ring-brand-amber accent-brand-amber" checked={notifSettings?.pushEnabled} onChange={e=>setNotifSettings({...notifSettings, pushEnabled: e.target.checked})} />
                  Enable Web Push
                </label>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-3 border-b border-neutral-100 dark:border-neutral-800 pb-1">Event Triggers</h3>
              <div className="space-y-3">
                {Object.entries(notifSettings?.eventTriggers || {}).map(([event, channels]: [string, any]) => (
                  <div key={event} className="bg-neutral-50 dark:bg-neutral-900/50 p-3 rounded-xl border border-neutral-100 dark:border-neutral-800">
                    <p className="font-medium capitalize mb-2 text-neutral-900 dark:text-neutral-100">{event.replace(/([A-Z])/g, ' $1').trim()}</p>
                    <div className="flex gap-4 text-neutral-600 dark:text-neutral-400">
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="rounded text-brand-amber focus:ring-brand-amber accent-brand-amber" checked={channels.email} onChange={e => setNotifSettings({...notifSettings, eventTriggers: {...notifSettings.eventTriggers, [event]: {...channels, email: e.target.checked}}})} /> Email</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="rounded text-brand-amber focus:ring-brand-amber accent-brand-amber" checked={channels.sms} onChange={e => setNotifSettings({...notifSettings, eventTriggers: {...notifSettings.eventTriggers, [event]: {...channels, sms: e.target.checked}}})} /> SMS</label>
                      <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" className="rounded text-brand-amber focus:ring-brand-amber accent-brand-amber" checked={channels.push} onChange={e => setNotifSettings({...notifSettings, eventTriggers: {...notifSettings.eventTriggers, [event]: {...channels, push: e.target.checked}}})} /> Push</label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
