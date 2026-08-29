'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { DataStore } from '@/lib/store/data-store';
import { useCurrency } from '@/lib/context/CurrencyLanguageContext';
import { useStore } from '@/lib/context/StoreContext';
import { cn, formatDate } from '@/lib/utils';
import { Product, Category } from '@/types';
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  Eye,
  MoreVertical,
  Package,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Check,
  X,
  Image as ImageIcon,
  Star,
  Copy,
} from 'lucide-react';
import { ImageUploadDropzone } from '@/components/common/ImageUploadDropzone';

type ViewMode = 'list' | 'grid';
type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';

export default function AdminProductsPage() {
  const { formatPriceValue } = useCurrency();
  const { categories, refreshData } = useStore();
  const [mounted, setMounted] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState<StockFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    setMounted(true);
    setProducts(DataStore.getProducts());
  }, []);

  const filtered = useMemo(() => {
    let result = [...products];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }
    if (categoryFilter !== 'all') {
      result = result.filter(p => p.category_id === categoryFilter);
    }
    if (stockFilter === 'in_stock') result = result.filter(p => p.total_stock > 5);
    if (stockFilter === 'low_stock') result = result.filter(p => p.total_stock > 0 && p.total_stock <= 5);
    if (stockFilter === 'out_of_stock') result = result.filter(p => p.total_stock === 0);
    return result;
  }, [products, searchQuery, categoryFilter, stockFilter]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map(p => p.id)));
    }
  };

  const deleteProduct = (id: string) => {
    DataStore.deleteProduct(id);
    setProducts(DataStore.getProducts());
    refreshData();
    setShowDeleteConfirm(null);
  };

  const bulkDelete = () => {
    selectedIds.forEach(id => DataStore.deleteProduct(id));
    setProducts(DataStore.getProducts());
    refreshData();
    setSelectedIds(new Set());
  };

  const toggleActive = (product: Product) => {
    const updated = { ...product, is_active: !product.is_active };
    DataStore.saveProduct(updated);
    setProducts(DataStore.getProducts());
    refreshData();
  };

  const duplicateProduct = (product: Product) => {
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}`,
      title: `${product.title} (Copy)`,
      slug: `${product.slug}-copy-${Date.now()}`,
      sku: `${product.sku}-COPY`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    DataStore.saveProduct(newProduct);
    setProducts(DataStore.getProducts());
    refreshData();
  };

  const handleCSVExport = () => {
    const headers = ['ID', 'Title', 'Brand', 'Category', 'Base Price', 'Sale Price', 'SKU', 'Stock', 'Active', 'Rating', 'Reviews'];
    const rows = products.map(p => [
      p.id,
      `"${p.title.replace(/"/g, '""')}"`,
      `"${p.brand}"`,
      `"${p.category_name || ''}"`,
      p.base_price,
      p.sale_price || '',
      p.sku,
      p.total_stock,
      p.is_active ? 'Yes' : 'No',
      p.rating_avg,
      p.review_count,
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ozeira_products_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCSVImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length <= 1) return;

      const newItems: Product[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map((s) => s.replace(/^"|"$/g, '').trim());
        if (parts.length >= 7) {
          const title = parts[1] || 'Imported Piece';
          const brand = parts[2] || 'Ozeira';
          const basePrice = parseFloat(parts[4]) || 1999;
          const salePrice = parts[5] ? parseFloat(parts[5]) : undefined;
          const sku = parts[6] || `OZ-IMP-${Date.now()}-${i}`;
          const stock = parseInt(parts[7]) || 10;
          const id = `prod-imp-${Date.now()}-${i}`;
          const slug = title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + `-${Date.now()}`;

          newItems.push({
            id,
            title,
            slug,
            description: title,
            short_description: title,
            brand,
            category_id: categories[0]?.id || 'cat-1',
            category_name: categories[0]?.name || 'Apparel & Knitwear',
            base_price: basePrice,
            sale_price: salePrice,
            discount_percent: salePrice ? Math.round(((basePrice - salePrice) / basePrice) * 100) : 0,
            sku,
            total_stock: stock,
            is_featured: false,
            is_trending: false,
            is_new: true,
            is_active: true,
            rating_avg: 5.0,
            review_count: 0,
            tags: ['imported', 'collection'],
            specifications: {},
            weight_grams: 500,
            images: [
              {
                id: `img-imp-${Date.now()}-${i}`,
                product_id: id,
                image_url: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=800',
                sort_order: 1,
                is_primary: true,
              },
            ],
            variants: [
              {
                id: `var-imp-${Date.now()}-${i}`,
                product_id: id,
                sku: `${sku}-STD`,
                additional_price: 0,
                stock_quantity: stock,
              },
            ],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
        }
      }
      if (newItems.length > 0) {
        newItems.forEach((p) => DataStore.saveProduct(p));
        setProducts(DataStore.getProducts());
        refreshData();
        alert(`Successfully imported ${newItems.length} products into catalogue!`);
      }
    };
    reader.readAsText(file);
  };

  if (!mounted) {
    return <div className="animate-pulse space-y-4"><div className="h-10 bg-white dark:bg-[#14151a] rounded-xl" /><div className="h-96 bg-white dark:bg-[#14151a] rounded-xl" /></div>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Products Vault</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">{filtered.length} total active catalog pieces</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-1.5 cursor-pointer transition-colors">
            <Upload className="w-3.5 h-3.5" />
            <span>Import CSV</span>
            <input type="file" accept=".csv" onChange={handleCSVImport} className="hidden" />
          </label>
          <button
            onClick={handleCSVExport}
            className="px-3 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-semibold bg-brand-amber hover:bg-brand-amber-dark text-white rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Piece
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white dark:bg-[#14151a] rounded-xl border border-neutral-200 dark:border-neutral-800 p-4 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Search products by name, SKU, or brand..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg text-xs outline-none focus:border-brand-amber"
            />
          </div>
          {/* Category filter */}
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 outline-none focus:border-brand-amber"
          >
            <option value="all">All Categories</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          {/* Stock filter */}
          <select
            value={stockFilter}
            onChange={(e) => { setStockFilter(e.target.value as StockFilter); setCurrentPage(1); }}
            className="px-3 py-2 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 outline-none focus:border-brand-amber"
          >
            <option value="all">All Stock Status</option>
            <option value="in_stock">In Stock (&gt;5)</option>
            <option value="low_stock">Low Stock (≤5)</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <div className="mt-3 flex items-center gap-3 p-2 bg-brand-amber/10 rounded-lg border border-brand-amber/20">
            <span className="text-xs font-semibold text-brand-amber">{selectedIds.size} selected</span>
            <button
              onClick={bulkDelete}
              className="text-xs text-red-600 dark:text-red-400 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 ml-auto"
            >
              Clear Selection
            </button>
          </div>
        )}
      </div>

      {/* Product table */}
      <div className="bg-white dark:bg-[#14151a] rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === paginated.length && paginated.length > 0}
                    onChange={toggleSelectAll}
                    className="w-3.5 h-3.5 rounded text-brand-amber focus:ring-brand-amber accent-brand-amber"
                  />
                </th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Piece</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">SKU</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Price</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Stock</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Rating</th>
                <th className="px-4 py-3 text-right font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {paginated.map((product) => {
                const primaryImage = product.images?.find(i => i.is_primary)?.image_url || product.images?.[0]?.image_url;
                return (
                  <tr key={product.id} className={cn('hover:bg-neutral-50/50 dark:hover:bg-neutral-900/50 transition-colors', selectedIds.has(product.id) && 'bg-brand-amber/5 dark:bg-brand-amber/10')}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(product.id)}
                        onChange={() => toggleSelect(product.id)}
                        className="w-3.5 h-3.5 rounded text-brand-amber focus:ring-brand-amber accent-brand-amber"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-neutral-100 dark:bg-neutral-800 overflow-hidden flex-shrink-0 border border-neutral-200 dark:border-neutral-700">
                          {primaryImage ? (
                            <img src={primaryImage} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-neutral-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-neutral-900 dark:text-neutral-100 truncate max-w-[220px]">{product.title}</p>
                          <p className="text-[11px] text-neutral-400">{product.category_name || 'Uncategorized'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-neutral-600 dark:text-neutral-400">{product.sku}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-neutral-900 dark:text-neutral-100">
                          {formatPriceValue(product.sale_price || product.base_price)}
                        </span>
                        {product.sale_price && (
                          <span className="text-[10px] text-neutral-400 line-through ml-1.5">
                            {formatPriceValue(product.base_price)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'font-semibold',
                        product.total_stock === 0 && 'text-red-600 dark:text-red-400',
                        product.total_stock > 0 && product.total_stock <= 5 && 'text-amber-600 dark:text-amber-400',
                        product.total_stock > 5 && 'text-emerald-600 dark:text-emerald-400',
                      )}>
                        {product.total_stock}
                        {product.total_stock === 0 && (
                          <AlertTriangle className="w-3 h-3 inline-block ml-1" />
                        )}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActive(product)}
                        className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                          product.is_active
                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/50'
                            : 'text-neutral-500 bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
                        )}
                      >
                        {product.is_active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                        <span className="text-neutral-800 dark:text-neutral-200 font-medium">{product.rating_avg.toFixed(1)}</span>
                        <span className="text-neutral-400">({product.review_count})</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/product/${product.slug}`}
                          target="_blank"
                          className="p-1.5 text-neutral-400 hover:text-brand-amber hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
                          title="View on storefront"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          onClick={() => setEditingProduct(product)}
                          className="p-1.5 text-neutral-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => duplicateProduct(product)}
                          className="p-1.5 text-neutral-400 hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/30 rounded-lg transition-colors"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(product.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Package className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-2" />
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">No products found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
            <p className="text-neutral-500 dark:text-neutral-400">
              Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filtered.length)} of {filtered.length} pieces
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 disabled:opacity-30 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'w-7 h-7 rounded-lg font-medium transition-colors',
                    page === currentPage
                      ? 'bg-brand-amber text-white'
                      : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 disabled:opacity-30 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-white dark:bg-[#14151a] text-neutral-900 dark:text-neutral-100 rounded-2xl border border-neutral-200 dark:border-neutral-800 max-w-sm w-full p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-base font-bold text-center">Archive Piece Permanently?</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 text-center mt-2">This will remove the product and all associated variants from live display.</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-xl text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteProduct(showDeleteConfirm)}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Product Modal */}
      {(showAddModal || editingProduct) && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          onClose={() => { setShowAddModal(false); setEditingProduct(null); }}
          onSave={(product) => {
            DataStore.saveProduct(product);
            setProducts(DataStore.getProducts());
            refreshData();
            setShowAddModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}

// ========== Product Form Modal ==========
function ProductFormModal({
  product,
  categories,
  onClose,
  onSave,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSave: (product: Product) => void;
}) {
  const isEditing = !!product;
  const [form, setForm] = useState({
    title: product?.title || '',
    description: product?.description || '',
    short_description: product?.short_description || '',
    brand: product?.brand || 'Ozeira',
    category_id: product?.category_id || '',
    base_price: product?.base_price?.toString() || '',
    sale_price: product?.sale_price?.toString() || '',
    discount_percent: product?.discount_percent?.toString() || '0',
    sku: product?.sku || '',
    total_stock: product?.total_stock?.toString() || '0',
    weight_grams: product?.weight_grams?.toString() || '0',
    dimensions: product?.dimensions || '',
    is_featured: product?.is_featured || false,
    is_trending: product?.is_trending || false,
    is_new: product?.is_new || true,
    is_active: product?.is_active ?? true,
    meta_title: product?.meta_title || '',
    meta_description: product?.meta_description || '',
    tags: product?.tags?.join(', ') || '',
    image_url: product?.images?.[0]?.image_url || '',
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'pricing' | 'media' | 'seo'>('basic');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const slug = form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const now = new Date().toISOString();
    const category = categories.find(c => c.id === form.category_id);

    const productData: Product = {
      id: product?.id || `prod-${Date.now()}`,
      title: form.title,
      slug: product?.slug || slug,
      description: form.description,
      short_description: form.short_description,
      category_id: form.category_id,
      category_name: category?.name,
      brand: form.brand,
      base_price: parseFloat(form.base_price) || 0,
      sale_price: form.sale_price ? parseFloat(form.sale_price) : undefined,
      discount_percent: parseFloat(form.discount_percent) || 0,
      sku: form.sku || `OZ-${Date.now()}`,
      total_stock: parseInt(form.total_stock) || 0,
      is_featured: form.is_featured,
      is_trending: form.is_trending,
      is_new: form.is_new,
      rating_avg: product?.rating_avg || 0,
      review_count: product?.review_count || 0,
      tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      specifications: product?.specifications || {},
      weight_grams: parseInt(form.weight_grams) || 0,
      dimensions: form.dimensions,
      is_active: form.is_active,
      meta_title: form.meta_title,
      meta_description: form.meta_description,
      images: form.image_url
        ? [{ id: product?.images?.[0]?.id || `img-${Date.now()}`, product_id: product?.id || '', image_url: form.image_url, alt_text: form.title, sort_order: 0, is_primary: true }]
        : product?.images || [],
      variants: product?.variants || [],
      created_at: product?.created_at || now,
      updated_at: now,
    };
    onSave(productData);
  };

  const tabs = [
    { id: 'basic', label: 'Basic Info' },
    { id: 'pricing', label: 'Pricing & Stock' },
    { id: 'media', label: 'Media' },
    { id: 'seo', label: 'SEO' },
  ] as const;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white dark:bg-[#14151a] text-neutral-900 dark:text-neutral-100 rounded-2xl border border-neutral-200 dark:border-neutral-800 max-w-2xl w-full my-8 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
          <h2 className="text-base font-bold text-neutral-900 dark:text-neutral-100">{isEditing ? 'Edit Catalog Piece' : 'Add New Atelier Piece'}</h2>
          <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-neutral-800 px-5">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-3 text-xs font-semibold border-b-2 -mb-px transition-colors',
                activeTab === tab.id
                  ? 'border-brand-amber text-brand-amber font-bold'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {activeTab === 'basic' && (
            <>
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg outline-none focus:border-brand-amber"
                  placeholder="e.g. Celestial Silk Drape Blouse"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Short Description</label>
                <input
                  type="text"
                  value={form.short_description}
                  onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg outline-none focus:border-brand-amber"
                  placeholder="Brief product tagline"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Full Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg outline-none focus:border-brand-amber resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Brand</label>
                  <input
                    type="text"
                    value={form.brand}
                    onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg outline-none focus:border-brand-amber"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Category</label>
                  <select
                    value={form.category_id}
                    onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg outline-none focus:border-brand-amber"
                  >
                    <option value="">Select category</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Tags (comma separated)</label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg outline-none focus:border-brand-amber"
                  placeholder="luxury, silk, premium"
                />
              </div>
              <div className="flex flex-wrap gap-4 pt-1">
                {(['is_featured', 'is_trending', 'is_new', 'is_active'] as const).map(key => (
                  <label key={key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.checked }))}
                      className="w-3.5 h-3.5 rounded text-brand-amber focus:ring-brand-amber accent-brand-amber"
                    />
                    <span className="text-xs text-neutral-700 dark:text-neutral-300 capitalize">{key.replace('is_', '').replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </>
          )}

          {activeTab === 'pricing' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Base Price (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.base_price}
                    onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg outline-none focus:border-brand-amber"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Sale Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.sale_price}
                    onChange={e => setForm(f => ({ ...f, sale_price: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg outline-none focus:border-brand-amber"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">SKU</label>
                  <input
                    type="text"
                    value={form.sku}
                    onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg font-mono outline-none focus:border-brand-amber"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Total Stock</label>
                  <input
                    type="number"
                    min="0"
                    value={form.total_stock}
                    onChange={e => setForm(f => ({ ...f, total_stock: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg outline-none focus:border-brand-amber"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Discount %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={form.discount_percent}
                    onChange={e => setForm(f => ({ ...f, discount_percent: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg outline-none focus:border-brand-amber"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Weight (grams)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.weight_grams}
                    onChange={e => setForm(f => ({ ...f, weight_grams: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg outline-none focus:border-brand-amber"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Dimensions</label>
                  <input
                    type="text"
                    value={form.dimensions}
                    onChange={e => setForm(f => ({ ...f, dimensions: e.target.value }))}
                    className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg outline-none focus:border-brand-amber"
                    placeholder="e.g. 30 × 25 × 5 cm"
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'media' && (
            <div className="space-y-4">
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Product Media (Supabase Bucket: ozeira-products)</label>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mb-3">
                  Upload high-resolution photography. Images are automatically optimized and cached on Supabase CDN for instant worldwide delivery.
                </p>
                <ImageUploadDropzone
                  bucket="ozeira-products"
                  folder="catalog"
                  currentImageUrl={form.image_url}
                  onImageUploaded={(url) => setForm(f => ({ ...f, image_url: url }))}
                  onImageRemoved={() => setForm(f => ({ ...f, image_url: '' }))}
                  aspectRatio="square"
                  label="Primary Product Image"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-1">Or Provide Image URL directly</label>
                <input
                  type="url"
                  value={form.image_url}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg font-mono text-xs outline-none focus:border-brand-amber"
                  placeholder="https://rgqzcjrduahsdkmqfuvr.supabase.co/storage/v1/object/public/..."
                />
              </div>
            </div>
          )}

          {activeTab === 'seo' && (
            <>
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Meta Title</label>
                <input
                  type="text"
                  value={form.meta_title}
                  onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg outline-none focus:border-brand-amber"
                  placeholder="SEO page title"
                />
              </div>
              <div>
                <label className="block font-semibold text-neutral-700 dark:text-neutral-300 mb-1">Meta Description</label>
                <textarea
                  rows={3}
                  value={form.meta_description}
                  onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                  className="w-full px-3 py-2 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg outline-none focus:border-brand-amber resize-none"
                  placeholder="SEO description for search engines"
                />
              </div>
            </>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg font-medium hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-brand-amber hover:bg-brand-amber-dark text-white rounded-lg font-semibold transition-colors"
            >
              {isEditing ? 'Update Piece' : 'Add Piece'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
