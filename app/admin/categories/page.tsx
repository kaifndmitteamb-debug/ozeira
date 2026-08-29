'use client';

import { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store/data-store';
import { Category } from '@/types';
import { useStore } from '@/lib/context/StoreContext';
import { cn } from '@/lib/utils';
import { Plus, Edit, Trash2, ArrowUp, ArrowDown, X, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import { ImageUploadDropzone } from '@/components/common/ImageUploadDropzone';

export default function CategoriesPage() {
  const { refreshData } = useStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    slug: '',
    description: '',
    image_url: '',
    sort_order: 0,
    is_active: true,
  });

  const loadData = () => {
    const data = DataStore.getCategories();
    data.sort((a, b) => a.sort_order - b.sort_order);
    setCategories(data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData(category);
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        slug: '',
        description: '',
        image_url: '',
        sort_order: categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) + 1 : 0,
        is_active: true,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData({ ...formData, name, slug: editingCategory ? formData.slug : slug });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const categoryToSave: Category = {
      id: editingCategory?.id || `cat-${Date.now()}`,
      name: formData.name || '',
      slug: formData.slug || '',
      description: formData.description || '',
      image_url: formData.image_url || '',
      sort_order: formData.sort_order || 0,
      is_active: formData.is_active ?? true,
      item_count: editingCategory?.item_count || 0,
    };

    DataStore.saveCategory(categoryToSave);
    refreshData();
    loadData();
    handleCloseModal();
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      DataStore.deleteCategory(id);
      refreshData();
      loadData();
    }
  };

  const moveOrder = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === categories.length - 1) return;

    const newCats = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    const tempOrder = newCats[index].sort_order;
    newCats[index].sort_order = newCats[targetIndex].sort_order;
    newCats[targetIndex].sort_order = tempOrder;

    DataStore.saveCategory(newCats[index]);
    DataStore.saveCategory(newCats[targetIndex]);
    
    loadData();
    refreshData();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Category Taxonomy</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage catalog categories and sort hierarchies.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-brand-amber hover:bg-brand-amber-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, idx) => (
          <div key={category.id} className="bg-white dark:bg-[#14151a] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden shadow-sm group">
            <div className="relative h-48 bg-neutral-100 dark:bg-neutral-800">
              {category.image_url ? (
                <Image
                  src={category.image_url}
                  alt={category.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-neutral-400">
                  <ImageIcon className="w-12 h-12 opacity-50" />
                </div>
              )}
              {!category.is_active && (
                <div className="absolute top-2 right-2 bg-neutral-900/80 text-white text-xs px-2 py-1 uppercase tracking-wider rounded">
                  Draft
                </div>
              )}
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">{category.name}</h3>
                  <p className="text-xs text-neutral-400 font-mono">/{category.slug}</p>
                </div>
                <div className="flex space-x-1">
                  <button
                    onClick={() => moveOrder(idx, 'up')}
                    disabled={idx === 0}
                    className="p-1.5 text-neutral-400 hover:text-brand-amber disabled:opacity-30 transition-colors"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveOrder(idx, 'down')}
                    disabled={idx === categories.length - 1}
                    className="p-1.5 text-neutral-400 hover:text-brand-amber disabled:opacity-30 transition-colors"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="flex justify-between items-center mt-5 pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <span className="text-xs text-neutral-500 dark:text-neutral-400">
                  {category.item_count || 0} Pieces
                </span>
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleOpenModal(category)}
                    className="text-neutral-500 dark:text-neutral-400 hover:text-brand-amber dark:hover:text-brand-amber transition-colors flex items-center text-xs font-medium"
                  >
                    <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-500 hover:text-red-700 transition-colors flex items-center text-xs font-medium"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#14151a] text-neutral-900 dark:text-neutral-100 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
              <h2 className="text-lg font-semibold text-brand-amber">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button onClick={handleCloseModal} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-4 text-sm">
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber"
                />
              </div>
              
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">URL Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 font-mono text-xs outline-none focus:border-brand-amber"
                />
              </div>

              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber"
                />
              </div>
              
              <div>
                <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Category Image (Supabase Bucket: ozeira-categories)</label>
                <ImageUploadDropzone
                  bucket="ozeira-categories"
                  folder="covers"
                  currentImageUrl={formData.image_url}
                  onImageUploaded={(url) => setFormData({ ...formData, image_url: url })}
                  onImageRemoved={() => setFormData({ ...formData, image_url: '' })}
                  aspectRatio="portrait"
                  label=""
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber"
                  />
                </div>
                
                <div className="flex items-center pt-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 dark:bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-emerald-600 after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                    <span className="ms-3 font-medium text-neutral-700 dark:text-neutral-300">Active</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 flex justify-end space-x-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-amber hover:bg-brand-amber-dark text-white font-medium rounded-lg transition-colors"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
