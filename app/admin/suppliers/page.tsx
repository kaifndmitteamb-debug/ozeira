'use client';

import React, { useState, useEffect } from 'react';
import {
  Truck,
  Globe2,
  RefreshCw,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap,
  ArrowRight,
  TrendingUp,
  Settings,
  Package,
  Layers,
  KeyRound,
  Check,
  X,
  Play,
  RotateCw,
  DollarSign,
  ShoppingCart,
  Send,
  Building2,
  ChevronRight,
  Sparkles,
  Link as LinkIcon,
  Trash2,
  Sliders,
  Eye,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import {
  Supplier,
  SupplierProductMapping,
  SupplierFulfillmentOrder,
  SupplierCatalogItem,
  SupplierApiLog,
  SupplierType,
} from '@/types/supplier';
import { SupplierService } from '@/lib/services/supplier-service';
import { CJApiClient } from '@/lib/services/cjdropshipping-api';
import { DeoDapApiClient } from '@/lib/services/deodap-api';

type TabType = 'overview' | 'integrations' | 'sourcing' | 'mappings' | 'queue' | 'logs';

export default function SupplierManagementPage() {
  const { formatAmount } = useCurrency();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [mappings, setMappings] = useState<SupplierProductMapping[]>([]);
  const [fulfillments, setFulfillments] = useState<SupplierFulfillmentOrder[]>([]);
  const [logs, setLogs] = useState<SupplierApiLog[]>([]);
  const [loading, setLoading] = useState(true);

  // Sourcing Search State
  const [sourcingQuery, setSourcingQuery] = useState('');
  const [sourcingSupplier, setSourcingSupplier] = useState<'all' | 'cjdropshipping' | 'deodap'>('all');
  const [sourcingItems, setSourcingItems] = useState<SupplierCatalogItem[]>([]);
  const [searchingSourcing, setSearchingSourcing] = useState(false);
  const [importingId, setImportingId] = useState<string | null>(null);
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Connection Test State
  const [testingSupplierId, setTestingSupplierId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; message: string; details?: any } | null>(null);

  // Fulfillment Action State
  const [pushingFulfillmentId, setPushingFulfillmentId] = useState<string | null>(null);
  const [isBulkPushing, setIsBulkPushing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Selected Log Drawer
  const [selectedLog, setSelectedLog] = useState<SupplierApiLog | null>(null);

  // API Configuration Modal State
  const [configuringSupplier, setConfiguringSupplier] = useState<Supplier | null>(null);
  const [credForm, setCredForm] = useState<{ apiKey: string; apiSecret: string; accessToken: string; partnerId: string; email: string }>({
    apiKey: '',
    apiSecret: '',
    accessToken: '',
    partnerId: '',
    email: '',
  });
  const [savingCreds, setSavingCreds] = useState(false);

  const loadData = () => {
    try {
      const supps = SupplierService.getSuppliers();
      const maps = SupplierService.getProductMappings();
      const fuls = SupplierService.getFulfillments();
      const apiLogs = SupplierService.getApiLogs();

      setSuppliers(supps);
      setMappings(maps);
      setFulfillments(fuls);
      setLogs(apiLogs);
    } catch (e) {
      console.error('Failed to load supplier data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Initial Sourcing search load
  useEffect(() => {
    handleSearchSourcing();
  }, [sourcingSupplier]);

  const handleSearchSourcing = async () => {
    setSearchingSourcing(true);
    try {
      let items: SupplierCatalogItem[] = [];
      const cjSupp = suppliers.find(s => s.type === 'cjdropshipping');
      const ddSupp = suppliers.find(s => s.type === 'deodap');

      if (sourcingSupplier === 'all' || sourcingSupplier === 'cjdropshipping') {
        const cjRes = await CJApiClient.searchProducts(
          sourcingQuery,
          1,
          cjSupp?.settings.pricingRule,
          cjSupp?.credentials
        );
        items.push(...cjRes.items);
      }

      if (sourcingSupplier === 'all' || sourcingSupplier === 'deodap') {
        const ddRes = await DeoDapApiClient.searchProducts(
          sourcingQuery,
          1,
          ddSupp?.settings.pricingRule,
          ddSupp?.credentials
        );
        items.push(...ddRes.items);
      }

      // Check already imported
      const mappedSkus = new Set(mappings.map(m => m.supplierSku));
      const enriched = items.map(i => ({
        ...i,
        isAlreadyImported: mappedSkus.has(i.supplierSku),
      }));

      setSourcingItems(enriched);
    } catch (err) {
      console.error('Sourcing search error:', err);
    } finally {
      setSearchingSourcing(false);
    }
  };

  const handleTestConnection = async (supplier: Supplier) => {
    setTestingSupplierId(supplier.id);
    setTestResult(null);
    try {
      let res: { success: boolean; message: string; details?: any };
      if (supplier.type === 'cjdropshipping') {
        res = await CJApiClient.testConnection(supplier.credentials);
      } else if (supplier.type === 'deodap') {
        res = await DeoDapApiClient.testConnection(supplier.credentials);
      } else {
        res = { success: true, message: 'Custom supplier endpoint active.' };
      }

      setTestResult({ id: supplier.id, ...res });
      SupplierService.logApiCall({
        supplierId: supplier.id,
        supplierName: supplier.name,
        action: 'test_connection',
        status: res.success ? 'success' : 'error',
        requestPayload: { target: supplier.type },
        responsePayload: res,
        durationMs: 140,
      });
      loadData();
    } catch (err: any) {
      setTestResult({ id: supplier.id, success: false, message: err?.message || 'Connection test failed' });
    } finally {
      setTestingSupplierId(null);
    }
  };

  const handleToggleAutoFulfill = (supplier: Supplier) => {
    const newVal = !supplier.settings.autoFulfillEnabled;
    SupplierService.updateSupplier(supplier.id, {
      settings: {
        ...supplier.settings,
        autoFulfillEnabled: newVal,
      },
    });
    setActionNotice(`${supplier.name} auto-fulfill is now ${newVal ? 'ENABLED (Instant Push)' : 'DISABLED (Manual Approval)'}.`);
    setTimeout(() => setActionNotice(null), 4000);
    loadData();
  };

  const handleImportProduct = async (item: SupplierCatalogItem) => {
    setImportingId(item.id);
    try {
      const { product } = await SupplierService.importProductFromSupplier(item, 'cat-3');
      setImportSuccessMsg(`Successfully imported "${product.title}" into Ozeira Catalog!`);
      setTimeout(() => setImportSuccessMsg(null), 5000);
      loadData();
      handleSearchSourcing();
    } catch (err: any) {
      alert(`Import failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setImportingId(null);
    }
  };

  const handlePushSingleFulfillment = async (fulfillmentId: string) => {
    setPushingFulfillmentId(fulfillmentId);
    try {
      const res = await SupplierService.pushFulfillmentToSupplier(fulfillmentId);
      if (res.success) {
        setActionNotice(`Order successfully pushed to supplier! Generated AWB: ${res.trackingNumber}`);
      } else {
        setActionNotice(`Supplier push failed: ${res.message}`);
      }
      setTimeout(() => setActionNotice(null), 5000);
      loadData();
    } catch (err: any) {
      alert(`Push failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setPushingFulfillmentId(null);
    }
  };

  const handleBulkPush = async () => {
    setIsBulkPushing(true);
    try {
      const res = await SupplierService.bulkPushFulfillments();
      setActionNotice(`Auto-fulfilled ${res.pushedCount} supplier orders seamlessly! (${res.failedCount} errors)`);
      setTimeout(() => setActionNotice(null), 5000);
      loadData();
    } catch (err: any) {
      alert(`Bulk push failed: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsBulkPushing(false);
    }
  };

  const handleDeleteMapping = (mappingId: string) => {
    if (confirm('Are you sure you want to remove this supplier SKU mapping?')) {
      SupplierService.deleteProductMapping(mappingId);
      loadData();
    }
  };

  const handleOpenConfig = (supplier: Supplier) => {
    setConfiguringSupplier(supplier);
    setCredForm({
      apiKey: supplier.credentials.apiKey || '',
      apiSecret: supplier.credentials.apiSecret || '',
      accessToken: supplier.credentials.accessToken || '',
      partnerId: supplier.credentials.partnerId || '',
      email: supplier.credentials.email || '',
    });
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configuringSupplier) return;
    setSavingCreds(true);

    try {
      const hasKeys = !!(credForm.apiKey.trim() || credForm.accessToken.trim());
      const updated = SupplierService.updateSupplier(configuringSupplier.id, {
        credentials: {
          apiKey: credForm.apiKey.trim() || undefined,
          apiSecret: credForm.apiSecret.trim() || undefined,
          accessToken: credForm.accessToken.trim() || undefined,
          partnerId: credForm.partnerId.trim() || undefined,
          email: credForm.email.trim() || undefined,
        },
        status: hasKeys ? 'active' : 'inactive',
      });

      setConfiguringSupplier(null);
      loadData();
      setActionNotice(`Credentials saved for ${updated.name}. Testing live connection...`);
      setTimeout(() => handleTestConnection(updated), 400);
    } catch (err: any) {
      alert(`Error saving credentials: ${err.message}`);
    } finally {
      setSavingCreds(false);
    }
  };

  // Metrics
  const totalSpend = suppliers.reduce((acc, s) => acc + s.stats.totalSpend, 0);
  const totalFulfilled = suppliers.reduce((acc, s) => acc + s.stats.totalOrdersFulfilled, 0);
  const pendingQueueCount = fulfillments.filter(f => f.supplierStatus === 'unfulfilled' || f.supplierStatus === 'queued').length;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-fade-in text-stone-900 dark:text-stone-100">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#c46331] uppercase tracking-wider mb-1">
            <Globe2 className="w-4 h-4" />
            <span>Automated Sourcing & Dropship Network</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 dark:text-stone-100 tracking-tight">
            Supplier Integrations & Auto-Fulfillment
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 max-w-2xl leading-relaxed">
            Eliminate manual order processing. Direct API synchronization with CJ Dropshipping (Global Air) and DeoDap (Indian Domestic B2B Wholesale).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2 text-stone-600 dark:text-stone-400 bg-white dark:bg-[#14151a] border border-stone-200 dark:border-stone-800 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors shadow-2xs"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {pendingQueueCount > 0 && (
            <button
              onClick={handleBulkPush}
              disabled={isBulkPushing}
              className="px-4 py-2.5 bg-[#c46331] hover:bg-[#a34c28] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Zap className="w-4 h-4" />
              <span>{isBulkPushing ? 'Auto-Fulfilling...' : `Auto-Fulfill Queue (${pendingQueueCount})`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Global Alerts */}
      {actionNotice && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-300 shadow-xs animate-slide-down">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-medium">{actionNotice}</span>
        </div>
      )}

      {importSuccessMsg && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-2xl flex items-center gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-xs animate-slide-down">
          <Sparkles className="w-5 h-5 text-[#c46331] shrink-0" />
          <span className="font-semibold">{importSuccessMsg}</span>
        </div>
      )}

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white dark:bg-[#14151a] p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Connected Suppliers</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-[#c46331]">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {suppliers.filter(s => s.status === 'active').length} Active
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            CJ Dropshipping + DeoDap
          </p>
        </div>

        <div className="bg-white dark:bg-[#14151a] p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Mapped SKUs</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600">
              <LinkIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {mappings.length} Products
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            Realtime stock & price sync
          </p>
        </div>

        <div className="bg-white dark:bg-[#14151a] p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Orders Dispatched</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {totalFulfilled} Orders
          </div>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
            Zero manual entry
          </p>
        </div>

        <div className="bg-white dark:bg-[#14151a] p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Pending Auto-Fulfill</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-serif font-bold text-stone-900 dark:text-stone-100">
            {pendingQueueCount} Queued
          </div>
          <p className="text-[11px] text-stone-500 dark:text-stone-400 mt-1">
            {pendingQueueCount === 0 ? 'All orders routed' : 'Ready to push to APIs'}
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto space-x-2 border-b border-stone-200 dark:border-stone-800 pb-2 hide-scrollbar">
        {[
          { id: 'overview', label: 'Dashboard & Sourcing Flow', icon: Layers },
          { id: 'integrations', label: 'API Connectors & Keys', icon: KeyRound },
          { id: 'sourcing', label: 'Product Sourcing Importer', icon: Search },
          { id: 'mappings', label: `SKU Mappings (${mappings.length})`, icon: LinkIcon },
          { id: 'queue', label: `Fulfillment Queue (${fulfillments.length})`, icon: Truck },
          { id: 'logs', label: 'API Audit Logs', icon: Info },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                'px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer',
                isActive
                  ? 'bg-[#1a1714] dark:bg-[#c46331] text-white shadow-xs'
                  : 'bg-white dark:bg-[#14151a] text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800/80 border border-stone-200 dark:border-stone-800'
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & FLOW */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-fade-in">
          {/* Active Connectors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {suppliers.map((supplier) => {
              const isConfigured = supplier.status === 'active' && !!(supplier.credentials.apiKey || supplier.credentials.accessToken);

              return (
                <div
                  key={supplier.id}
                  className="bg-white dark:bg-[#14151a] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-xs',
                          supplier.type === 'cjdropshipping' ? 'bg-gradient-to-br from-amber-600 to-[#c46331]' : 'bg-gradient-to-br from-blue-600 to-indigo-700'
                        )}>
                          {supplier.type === 'cjdropshipping' ? 'CJ' : 'DD'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                              {supplier.name}
                            </h3>
                            {isConfigured ? (
                              <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Connected
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Not Configured
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                            {supplier.type === 'cjdropshipping' ? 'Global Warehouses & Air Express' : 'Indian Domestic B2B Wholesale Hubs'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 dark:text-stone-300 mb-5 leading-relaxed">
                      {supplier.description}
                    </p>

                    {/* Settings Highlights */}
                    <div className="grid grid-cols-2 gap-3 mb-6 text-xs bg-stone-50 dark:bg-stone-900/50 p-4 rounded-2xl border border-stone-100 dark:border-stone-800/80">
                      <div>
                        <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold">Auto-Fulfill</span>
                        <span className={cn(
                          "font-semibold flex items-center gap-1 mt-0.5",
                          supplier.settings.autoFulfillEnabled ? "text-emerald-600 dark:text-emerald-400" : "text-stone-500"
                        )}>
                          <Check className="w-3.5 h-3.5" />
                          {supplier.settings.autoFulfillEnabled ? 'Instant Auto-Push' : 'Manual Approval'}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold">Pricing Rule</span>
                        <span className="font-semibold text-stone-900 dark:text-stone-100 mt-0.5 block">
                          Cost + {supplier.settings.pricingRule.markupValue}% (.{supplier.settings.pricingRule.roundToEnding})
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold">Default Courier</span>
                        <span className="font-semibold text-stone-900 dark:text-stone-200 mt-0.5 block truncate">
                          {supplier.settings.defaultShippingMethod}
                        </span>
                      </div>
                      <div>
                        <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold">Inventory Sync</span>
                        <span className="font-semibold text-stone-900 dark:text-stone-200 mt-0.5 block">
                          Hourly Realtime
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-4 border-t border-stone-100 dark:border-stone-800 flex-wrap">
                    <button
                      onClick={() => handleOpenConfig(supplier)}
                      className="py-2 px-3 bg-[#c46331] hover:bg-[#a34c28] text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isConfigured ? 'Edit API Keys' : 'Configure API Keys'}</span>
                    </button>
                    <button
                      onClick={() => handleTestConnection(supplier)}
                      disabled={testingSupplierId === supplier.id}
                      className="py-2 px-3 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', testingSupplierId === supplier.id && 'animate-spin')} />
                      <span>{testingSupplierId === supplier.id ? 'Testing...' : 'Test Connection'}</span>
                    </button>
                    <button
                      onClick={() => handleToggleAutoFulfill(supplier)}
                      className={cn(
                        'py-2 px-3 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer',
                        supplier.settings.autoFulfillEnabled
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60'
                          : 'bg-stone-900 dark:bg-stone-800 text-white'
                      )}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>{supplier.settings.autoFulfillEnabled ? 'Disable Auto' : 'Enable Auto'}</span>
                    </button>
                  </div>

                  {testResult && testResult.id === supplier.id && (
                    <div className={cn(
                      'mt-4 p-3 rounded-xl text-xs flex items-start gap-2 border',
                      testResult.success 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                    )}>
                      {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />}
                      <div>
                        <p className="font-bold">{testResult.message}</p>
                        {testResult.details && (
                          <p className="text-[11px] opacity-80 mt-0.5">
                            Hubs: {testResult.details.warehouseHubs?.join(', ') || testResult.details.supportedCarriers?.join(', ') || 'Online'}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Sourcing Quick Action CTA */}
          <div className="bg-gradient-to-r from-stone-900 via-[#1c1a17] to-[#25201b] border border-stone-800 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#c46331]/20 border border-[#c46331]/30 rounded-full text-xs font-bold text-[#c46331] uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>1-Click Catalog Sourcing</span>
              </div>
              <h2 className="text-2xl font-serif font-bold">
                Source High-Margin Luxury Products from CJ & DeoDap
              </h2>
              <p className="text-xs text-stone-400 max-w-xl leading-relaxed">
                Browse millions of wholesale jewelry, leather travel items, silk scarves, and home sanctuaries. Automatic luxury pricing markup and zero manual inventory creation.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('sourcing')}
              className="px-6 py-3.5 bg-[#c46331] hover:bg-[#a34c28] text-white text-xs font-bold uppercase tracking-wider rounded-2xl flex items-center gap-2 shrink-0 transition-all shadow-md cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Explore Sourcing Catalog</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: INTEGRATIONS & API KEYS */}
      {activeTab === 'integrations' && (
        <div className="space-y-6 animate-fade-in">
          {suppliers.map((supplier) => {
            const isConfigured = supplier.status === 'active' && !!(supplier.credentials.apiKey || supplier.credentials.accessToken);

            return (
              <div
                key={supplier.id}
                className="bg-white dark:bg-[#14151a] border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg text-white shadow-xs',
                      supplier.type === 'cjdropshipping' ? 'bg-gradient-to-br from-amber-600 to-[#c46331]' : 'bg-gradient-to-br from-blue-600 to-indigo-700'
                    )}>
                      {supplier.type === 'cjdropshipping' ? 'CJ' : 'DD'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">
                          {supplier.name}
                        </h3>
                        {isConfigured ? (
                          <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            Connected (Live)
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50 rounded-full text-[10px] font-bold uppercase tracking-wider">
                            Not Configured / Disconnected
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                        {supplier.type === 'cjdropshipping' ? 'CJ Open API 2.0 (Developer Key & Access Token)' : 'DeoDap Merchant Dropship B2B Key & Secret'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => handleOpenConfig(supplier)}
                      className="px-4 py-2 bg-[#c46331] hover:bg-[#a34c28] text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isConfigured ? 'Change Credentials' : 'Set API Credentials'}</span>
                    </button>
                    <button
                      onClick={() => handleTestConnection(supplier)}
                      disabled={testingSupplierId === supplier.id}
                      className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className={cn('w-3.5 h-3.5', testingSupplierId === supplier.id && 'animate-spin')} />
                      <span>{testingSupplierId === supplier.id ? 'Testing...' : 'Test Live Connection'}</span>
                    </button>
                  </div>
                </div>

                {/* Status Notice */}
                {!isConfigured && (
                  <div className="p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-amber-900 dark:text-amber-200">No Live API Credentials Configured</p>
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                          Click "Set API Credentials" above to input your official API keys before public live deployment.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenConfig(supplier)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl whitespace-nowrap cursor-pointer shrink-0"
                    >
                      Enter Keys
                    </button>
                  </div>
                )}

                {/* Configured Keys Preview */}
                {isConfigured && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs bg-stone-50 dark:bg-stone-900/40 p-4 rounded-2xl border border-stone-100 dark:border-stone-800/80">
                    <div>
                      <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold">API Key</span>
                      <span className="font-mono text-stone-900 dark:text-stone-200 mt-0.5 block truncate">
                        {supplier.credentials.apiKey ? `${supplier.credentials.apiKey.slice(0, 4)}••••••••${supplier.credentials.apiKey.slice(-4)}` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold">Secret / Token</span>
                      <span className="font-mono text-stone-900 dark:text-stone-200 mt-0.5 block truncate">
                        {supplier.credentials.apiSecret || supplier.credentials.accessToken ? '••••••••••••••••' : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-500 dark:text-stone-400 block text-[10px] uppercase font-bold">Account / Partner ID</span>
                      <span className="font-sans text-stone-900 dark:text-stone-200 mt-0.5 block truncate">
                        {supplier.credentials.email || supplier.credentials.partnerId || 'Standard Tier'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Test Result Message */}
                {testResult && testResult.id === supplier.id && (
                  <div className={cn(
                    'p-3.5 rounded-xl text-xs flex items-start gap-2 border',
                    testResult.success 
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-200 dark:border-emerald-800'
                      : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-200 dark:border-rose-800'
                  )}>
                    {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />}
                    <div>
                      <p className="font-bold">{testResult.message}</p>
                      {testResult.details && (
                        <p className="text-[11px] opacity-80 mt-0.5">
                          Hubs: {testResult.details.warehouseHubs?.join(', ') || testResult.details.supportedCarriers?.join(', ') || 'Online'}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Pricing & Automation Rules */}
                <div className="pt-4 border-t border-stone-100 dark:border-stone-800 space-y-4">
                  <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-[#c46331]" />
                    <span>Automated Markup & Fulfillment Rules</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
                    <div>
                      <label className="block font-bold text-stone-600 dark:text-stone-400 mb-1">
                        Markup Percentage (+%)
                      </label>
                      <input
                        type="number"
                        defaultValue={supplier.settings.pricingRule.markupValue}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val)) {
                            SupplierService.updateSupplier(supplier.id, {
                              settings: {
                                ...supplier.settings,
                                pricingRule: { ...supplier.settings.pricingRule, markupValue: val }
                              }
                            });
                          }
                        }}
                        className="w-full px-3.5 py-2 border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-600 dark:text-stone-400 mb-1">
                        Price Ending Rule (e.g. 999)
                      </label>
                      <input
                        type="number"
                        defaultValue={supplier.settings.pricingRule.roundToEnding}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val)) {
                            SupplierService.updateSupplier(supplier.id, {
                              settings: {
                                ...supplier.settings,
                                pricingRule: { ...supplier.settings.pricingRule, roundToEnding: val }
                              }
                            });
                          }
                        }}
                        className="w-full px-3.5 py-2 border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-stone-600 dark:text-stone-400 mb-1">
                        Default Courier Dispatch
                      </label>
                      <select
                        defaultValue={supplier.settings.defaultShippingMethod}
                        onChange={(e) => {
                          SupplierService.updateSupplier(supplier.id, {
                            settings: {
                              ...supplier.settings,
                              defaultShippingMethod: e.target.value
                            }
                          });
                        }}
                        className="w-full px-3.5 py-2 border border-stone-200 dark:border-stone-700 rounded-xl bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100"
                      >
                        {supplier.type === 'cjdropshipping' ? (
                          <>
                            <option value="CJPacket Fast Line">CJPacket Fast Line (Insured)</option>
                            <option value="CJPacket Sensitive">CJPacket Sensitive</option>
                            <option value="DHL Express Air">DHL Express Air</option>
                          </>
                        ) : (
                          <>
                            <option value="Delhivery Surface/Air Express">Delhivery Surface/Air Express</option>
                            <option value="BlueDart Air Express">BlueDart Air Express</option>
                            <option value="XpressBees Priority">XpressBees Priority</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: PRODUCT SOURCING & 1-CLICK IMPORTER */}
      {activeTab === 'sourcing' && (
        <div className="space-y-6 animate-fade-in">
          {/* Search & Filter Bar */}
          <div className="bg-white dark:bg-[#14151a] p-5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xs flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-80">
                <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search rings, scarves, leather bags, candles..."
                  value={sourcingQuery}
                  onChange={(e) => setSourcingQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchSourcing()}
                  className="w-full pl-9 pr-4 py-2 border border-stone-200 dark:border-stone-700 rounded-xl text-xs bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:border-[#c46331]"
                />
              </div>
              <button
                onClick={handleSearchSourcing}
                disabled={searchingSourcing}
                className="px-4 py-2 bg-[#1a1714] dark:bg-[#c46331] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                {searchingSourcing ? 'Searching...' : 'Search'}
              </button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Supplier:</span>
              <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setSourcingSupplier('all')}
                  className={cn('px-3 py-1 rounded-lg', sourcingSupplier === 'all' && 'bg-white dark:bg-stone-700 shadow-2xs')}
                >
                  All
                </button>
                <button
                  onClick={() => setSourcingSupplier('cjdropshipping')}
                  className={cn('px-3 py-1 rounded-lg', sourcingSupplier === 'cjdropshipping' && 'bg-white dark:bg-stone-700 shadow-2xs')}
                >
                  CJ Dropshipping
                </button>
                <button
                  onClick={() => setSourcingSupplier('deodap')}
                  className={cn('px-3 py-1 rounded-lg', sourcingSupplier === 'deodap' && 'bg-white dark:bg-stone-700 shadow-2xs')}
                >
                  DeoDap India
                </button>
              </div>
            </div>
          </div>

          {/* Sourcing Grid */}
          {searchingSourcing ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-96 bg-stone-100 dark:bg-stone-800 rounded-3xl animate-pulse" />
              ))}
            </div>
          ) : sourcingItems.length === 0 ? (
            <div className="bg-white dark:bg-[#14151a] p-12 rounded-3xl border border-stone-200 dark:border-stone-800 text-center text-stone-400">
              <Package className="w-12 h-12 mx-auto mb-3 text-stone-300 dark:text-stone-700" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No supplier products found.</p>
              <p className="text-xs mt-1">Try searching for keywords like "ring", "leather", "scarf", or "candle".</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sourcingItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-white dark:bg-[#14151a] border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-xs hover:border-[#c46331]/50 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Image & Supplier Badge */}
                    <div className="relative h-56 bg-stone-100 dark:bg-stone-900 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className={cn(
                          'px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-lg text-white shadow-xs',
                          item.supplierType === 'cjdropshipping' ? 'bg-[#c46331]' : 'bg-blue-600'
                        )}>
                          {item.supplierName}
                        </span>
                        <span className="px-2 py-1 text-[10px] font-semibold bg-black/60 backdrop-blur-md text-white rounded-lg">
                          SKU: {item.supplierSku}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-bold">
                        {item.stockQuantity} in stock
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-5 space-y-3">
                      <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100 line-clamp-2">
                        {item.title}
                      </h3>
                      <p className="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>

                      {/* Pricing Breakdown Card */}
                      <div className="bg-stone-50 dark:bg-stone-900/60 p-3.5 rounded-2xl border border-stone-100 dark:border-stone-800 space-y-2 text-xs">
                        <div className="flex justify-between items-center text-stone-500">
                          <span>Wholesale Base Cost:</span>
                          <span className="font-bold text-stone-700 dark:text-stone-300">
                            {item.costCurrency === 'USD' ? `$${item.costPrice} (${formatAmount(item.costPriceINR)})` : formatAmount(item.costPriceINR)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[#c46331] font-bold">
                          <span>Suggested Retail:</span>
                          <span className="text-sm font-serif">{formatAmount(item.suggestedRetailPriceINR)}</span>
                        </div>
                        <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] pt-1 border-t border-stone-200/50 dark:border-stone-800">
                          <span>Gross Margin:</span>
                          <span>{item.estimatedMarginPercent}% Profit (+{formatAmount(item.suggestedRetailPriceINR - item.costPriceINR)})</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-5 pt-0">
                    {item.isAlreadyImported ? (
                      <div className="w-full py-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 border border-emerald-200 dark:border-emerald-900/50">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Already In Catalog</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleImportProduct(item)}
                        disabled={importingId === item.id}
                        className="w-full py-2.5 bg-[#1a1714] dark:bg-[#c46331] hover:bg-[#c46331] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="w-4 h-4" />
                        <span>{importingId === item.id ? 'Importing...' : '1-Click Import to Ozeira'}</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SKU MAPPINGS */}
      {activeTab === 'mappings' && (
        <div className="bg-white dark:bg-[#14151a] rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs animate-fade-in">
          <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Connected Product SKU Mappings
              </h3>
              <p className="text-xs text-stone-500">
                All Ozeira items linked to automatic supplier fulfillment routes.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('sourcing')}
              className="px-3.5 py-1.5 bg-[#c46331] text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Map New Product</span>
            </button>
          </div>

          {mappings.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              <LinkIcon className="w-12 h-12 mx-auto mb-3 text-stone-300 dark:text-stone-700" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No product SKUs mapped yet.</p>
              <p className="text-xs mt-1">Connect your DeoDap or CJ Dropshipping API and use 1-Click Catalog Sourcing to link items.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-stone-50 dark:bg-stone-900/60 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider text-[10px] border-b border-stone-100 dark:border-stone-800">
                  <tr>
                    <th className="px-6 py-3.5">Ozeira Product & SKU</th>
                    <th className="px-6 py-3.5">Supplier</th>
                    <th className="px-6 py-3.5">Supplier SKU</th>
                    <th className="px-6 py-3.5">Wholesale Cost</th>
                    <th className="px-6 py-3.5">Retail Price</th>
                    <th className="px-6 py-3.5">Gross Margin</th>
                    <th className="px-6 py-3.5">Inventory Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                  {mappings.map((map) => (
                    <tr key={map.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-stone-900 dark:text-stone-100 max-w-xs truncate">
                          {map.productTitle}
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono">
                          {map.productSku}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'px-2 py-0.5 rounded-md font-bold uppercase text-[10px] text-white',
                          map.supplierId === 'supplier-cjdropshipping' ? 'bg-[#c46331]' : 'bg-blue-600'
                        )}>
                          {map.supplierName}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-[#c46331]">
                        {map.supplierSku}
                      </td>
                      <td className="px-6 py-4 font-semibold text-stone-700 dark:text-stone-300">
                        {formatAmount(map.supplierPriceINR)}
                      </td>
                      <td className="px-6 py-4 font-bold text-stone-900 dark:text-stone-100">
                        {formatAmount(map.retailPrice)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold rounded-md">
                          {map.marginPercent}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                          <Check className="w-3.5 h-3.5" />
                          Active
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteMapping(map.id)}
                          className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                          title="Delete Mapping"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: AUTO-FULFILLMENT QUEUE */}
      {activeTab === 'queue' && (
        <div className="bg-white dark:bg-[#14151a] rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs animate-fade-in">
          <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                Supplier Auto-Fulfillment Queue & Dispatch History
              </h3>
              <p className="text-xs text-stone-500">
                Live dropship orders routed to CJ Dropshipping and DeoDap.
              </p>
            </div>
            {pendingQueueCount > 0 && (
              <button
                onClick={handleBulkPush}
                disabled={isBulkPushing}
                className="px-4 py-2 bg-[#c46331] text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>{isBulkPushing ? 'Processing...' : 'Bulk Push All'}</span>
              </button>
            )}
          </div>

          {fulfillments.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              <Truck className="w-12 h-12 mx-auto mb-3 text-stone-300 dark:text-stone-700" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">Fulfillment queue is empty.</p>
              <p className="text-xs mt-1">When customers place orders with mapped products, they will appear here automatically.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-stone-50 dark:bg-stone-900/60 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider text-[10px] border-b border-stone-100 dark:border-stone-800">
                  <tr>
                    <th className="px-6 py-3.5">Order #</th>
                    <th className="px-6 py-3.5">Supplier</th>
                    <th className="px-6 py-3.5">Line Items</th>
                    <th className="px-6 py-3.5">Wholesale Spend</th>
                    <th className="px-6 py-3.5">Carrier & AWB</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80">
                  {fulfillments.map((ful) => (
                    <tr key={ful.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-[#c46331]">
                        {ful.orderNumber}
                      </td>
                      <td className="px-6 py-4 font-semibold text-stone-900 dark:text-stone-100">
                        {ful.supplierName}
                      </td>
                      <td className="px-6 py-4">
                        {ful.items.map(item => (
                          <div key={item.productId} className="text-xs">
                            <span className="font-semibold">{item.quantity}x</span> {item.productTitle}
                          </div>
                        ))}
                      </td>
                      <td className="px-6 py-4 font-bold text-stone-900 dark:text-stone-100">
                        {formatAmount(ful.totalCostINR)}
                      </td>
                      <td className="px-6 py-4">
                        {ful.trackingNumber ? (
                          <div className="text-xs">
                            <p className="font-bold text-stone-900 dark:text-stone-200">{ful.trackingCourier}</p>
                            <a
                              href={ful.trackingUrl || '#'}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#c46331] hover:underline flex items-center gap-1 font-mono text-[11px]"
                            >
                              <span>{ful.trackingNumber}</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-stone-400">Not Dispatched</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                          ful.supplierStatus === 'shipped' && 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50',
                          ful.supplierStatus === 'queued' && 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50',
                          ful.supplierStatus === 'unfulfilled' && 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400',
                          ful.supplierStatus === 'failed' && 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                        )}>
                          {ful.supplierStatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {ful.supplierStatus !== 'shipped' ? (
                          <button
                            onClick={() => handlePushSingleFulfillment(ful.id)}
                            disabled={pushingFulfillmentId === ful.id}
                            className="px-3 py-1.5 bg-[#1a1714] dark:bg-[#c46331] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                          >
                            {pushingFulfillmentId === ful.id ? 'Pushing...' : 'Push Order'}
                          </button>
                        ) : (
                          <span className="text-emerald-600 font-semibold text-xs flex items-center justify-end gap-1">
                            <Check className="w-3.5 h-3.5" />
                            Synced
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 6: API LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-[#14151a] rounded-3xl border border-stone-200 dark:border-stone-800 overflow-hidden shadow-xs animate-fade-in">
          <div className="p-5 border-b border-stone-100 dark:border-stone-800">
            <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
              Real-time API Interaction & Webhook Audit Logs
            </h3>
            <p className="text-xs text-stone-500">
              Diagnostic audit trail of supplier payload transmissions, responses, and execution latencies.
            </p>
          </div>

          {logs.length === 0 ? (
            <div className="p-12 text-center text-stone-400">
              <Globe2 className="w-12 h-12 mx-auto mb-3 text-stone-300 dark:text-stone-700" />
              <p className="text-sm font-semibold text-stone-700 dark:text-stone-300">No API activity logs recorded yet.</p>
              <p className="text-xs mt-1">Live supplier API calls, health checks, and sync events will be logged here in real time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-stone-50 dark:bg-stone-900/60 text-stone-500 dark:text-stone-400 font-bold uppercase tracking-wider text-[10px] border-b border-stone-100 dark:border-stone-800">
                  <tr>
                    <th className="px-6 py-3.5">Timestamp</th>
                    <th className="px-6 py-3.5">Supplier</th>
                    <th className="px-6 py-3.5">Action</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Latency</th>
                    <th className="px-6 py-3.5 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800/80 font-mono text-[11px]">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-900/30 transition-colors">
                      <td className="px-6 py-4 text-stone-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="px-6 py-4 font-sans font-semibold text-stone-900 dark:text-stone-100">
                        {log.supplierName}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#c46331]">
                        {log.action}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          'px-2 py-0.5 rounded-md font-bold uppercase text-[10px]',
                          log.status === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600' : 'bg-rose-50 text-rose-600'
                        )}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-stone-500">
                        {log.durationMs}ms
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-700 dark:text-stone-300 rounded-lg text-xs font-sans font-semibold cursor-pointer"
                        >
                          View JSON
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* JSON Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#1c1a17] border border-stone-200 dark:border-stone-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center">
              <div>
                <h3 className="font-serif font-bold text-sm text-stone-900 dark:text-stone-100">
                  API Log Detail: {selectedLog.action}
                </h3>
                <p className="text-xs text-stone-500">{selectedLog.supplierName} • {selectedLog.timestamp}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
              >
                <X className="w-5 h-5 text-stone-400" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 mb-1">Response Payload:</h4>
                <pre className="p-4 bg-stone-950 text-emerald-400 rounded-2xl text-xs overflow-x-auto font-mono">
                  {JSON.stringify(selectedLog.responsePayload, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configure Supplier API Credentials Modal */}
      {configuringSupplier && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-[#14151a] border border-stone-200 dark:border-stone-800 rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl animate-scale-up">
            <div className="p-6 border-b border-stone-100 dark:border-stone-800 flex justify-between items-center bg-stone-50/50 dark:bg-stone-900/50">
              <div className="flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-xs',
                  configuringSupplier.type === 'cjdropshipping' ? 'bg-gradient-to-br from-amber-600 to-[#c46331]' : 'bg-gradient-to-br from-blue-600 to-indigo-700'
                )}>
                  {configuringSupplier.type === 'cjdropshipping' ? 'CJ' : 'DD'}
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 dark:text-stone-100">
                    Connect {configuringSupplier.name}
                  </h3>
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    Enter your live merchant API credentials
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfiguringSupplier(null)}
                className="p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCredentials} className="p-6 space-y-4 overflow-y-auto">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-900 dark:text-amber-300 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-[#c46331]" />
                  Live Production API Credentials
                </p>
                <span>
                  {configuringSupplier.type === 'cjdropshipping'
                    ? 'Get your API Key and Access Token from your CJ Dropshipping Developer Portal (API 2.0).'
                    : 'Get your Merchant API Key & Secret from your DeoDap B2B Wholesale dashboard.'}
                </span>
              </div>

              {configuringSupplier.type === 'cjdropshipping' ? (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      CJ Developer API Key <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="Paste your CJ API Key / App Key"
                      value={credForm.apiKey}
                      onChange={(e) => setCredForm(prev => ({ ...prev, apiKey: e.target.value }))}
                      required
                      className="w-full px-3.5 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-xs bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:border-[#c46331]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      CJ Access Token
                    </label>
                    <input
                      type="password"
                      placeholder="Paste your CJ Access Token"
                      value={credForm.accessToken}
                      onChange={(e) => setCredForm(prev => ({ ...prev, accessToken: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-xs bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:border-[#c46331]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Registered CJ Account Email
                    </label>
                    <input
                      type="email"
                      placeholder="merchant@ozeira.com"
                      value={credForm.email}
                      onChange={(e) => setCredForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-xs bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:border-[#c46331]"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      DeoDap Merchant API Key <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="e.g. dd_live_key_..."
                      value={credForm.apiKey}
                      onChange={(e) => setCredForm(prev => ({ ...prev, apiKey: e.target.value }))}
                      required
                      className="w-full px-3.5 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-xs bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:border-[#c46331]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      DeoDap API Secret <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="e.g. dd_secret_..."
                      value={credForm.apiSecret}
                      onChange={(e) => setCredForm(prev => ({ ...prev, apiSecret: e.target.value }))}
                      required
                      className="w-full px-3.5 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-xs bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:border-[#c46331]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider mb-1">
                      Partner / Vendor ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DD-PARTNER-1029"
                      value={credForm.partnerId}
                      onChange={(e) => setCredForm(prev => ({ ...prev, partnerId: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-xs bg-stone-50 dark:bg-stone-900 text-stone-900 dark:text-stone-100 outline-none focus:border-[#c46331]"
                    />
                  </div>
                </>
              )}

              <div className="pt-4 border-t border-stone-100 dark:border-stone-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfiguringSupplier(null)}
                  className="px-4 py-2.5 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 text-xs font-bold rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCreds}
                  className="px-5 py-2.5 bg-[#c46331] hover:bg-[#a34c28] text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{savingCreds ? 'Saving...' : 'Save & Verify Live'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
