'use client';

import { useState, useEffect } from 'react';
import { DataStore } from '@/lib/store/data-store';
import { CMSPage } from '@/types';
import { useStore } from '@/lib/context/StoreContext';
import { formatDate } from '@/lib/utils';
import { Plus, Edit, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';

export default function CMSPages() {
  const { refreshData } = useStore();
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<CMSPage | null>(null);
  
  const [formData, setFormData] = useState<Partial<CMSPage>>({});

  const loadData = () => {
    setPages(DataStore.getCMSPages());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (page?: CMSPage) => {
    if (page) {
      setEditingPage(page);
      setFormData(page);
    } else {
      setEditingPage(null);
      setFormData({
        title: '',
        slug: '',
        content: '',
        meta_title: '',
        meta_description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData({ ...formData, title, slug: editingPage ? formData.slug : slug });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const toSave: CMSPage = {
      id: editingPage?.id || `cms-${Date.now()}`,
      title: formData.title || '',
      slug: formData.slug || '',
      content: formData.content || '',
      meta_title: formData.meta_title,
      meta_description: formData.meta_description,
      updated_at: new Date().toISOString()
    };

    DataStore.saveCMSPage(toSave);
    refreshData();
    loadData();
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Editorial & CMS Pages</h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Manage institutional narratives, policies, and bespoke pages.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center space-x-2 bg-brand-amber hover:bg-brand-amber-dark text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Page</span>
        </button>
      </div>

      <div className="bg-white dark:bg-[#14151a] border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-xs text-left">
          <thead className="bg-neutral-50 dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 font-medium border-b border-neutral-200 dark:border-neutral-800 uppercase tracking-wider">
            <tr>
              <th className="px-5 py-3">Title</th>
              <th className="px-5 py-3">Slug (URL)</th>
              <th className="px-5 py-3">Last Updated</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {pages.map((page) => (
              <tr key={page.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-900/50 transition-colors">
                <td className="px-5 py-3.5 font-medium text-neutral-900 dark:text-neutral-100">{page.title}</td>
                <td className="px-5 py-3.5 font-mono text-neutral-500 dark:text-neutral-400">/{page.slug}</td>
                <td className="px-5 py-3.5 text-neutral-500 dark:text-neutral-400">{formatDate(page.updated_at)}</td>
                <td className="px-5 py-3.5">
                  <div className="flex justify-end space-x-4">
                    <button onClick={() => handleOpenModal(page)} className="text-neutral-500 dark:text-neutral-400 hover:text-brand-amber dark:hover:text-brand-amber flex items-center font-medium">
                      <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </button>
                    <Link href={`/${page.slug}`} target="_blank" className="text-neutral-500 dark:text-neutral-400 hover:text-brand-amber dark:hover:text-brand-amber flex items-center font-medium">
                      <ExternalLink className="w-3.5 h-3.5 mr-1" /> View
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
            {pages.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-neutral-500 dark:text-neutral-400">
                  No pages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#14151a] text-neutral-900 dark:text-neutral-100 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center justify-between p-4 border-b border-neutral-100 dark:border-neutral-800 shrink-0 bg-neutral-50 dark:bg-neutral-900/50">
              <h2 className="text-lg font-semibold text-brand-amber">
                {editingPage ? 'Edit Page' : 'Add New Page'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden text-sm">
              <div className="p-6 space-y-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Page Title *</label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={handleTitleChange}
                      className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 outline-none focus:border-brand-amber"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">URL Slug *</label>
                    <input
                      type="text"
                      required
                      readOnly={!!editingPage}
                      value={formData.slug}
                      onChange={e => setFormData({...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                      className="w-full border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 font-mono text-xs outline-none"
                    />
                    {editingPage && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">Slug is immutable for established URLs.</p>}
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-neutral-700 dark:text-neutral-300 mb-1">Page Content (HTML / Markdown supported) *</label>
                  <textarea
                    required
                    rows={12}
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                    className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 font-mono text-xs outline-none focus:border-brand-amber"
                    placeholder="<h1>Heading</h1><p>Content...</p>"
                  />
                </div>

                <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-4">SEO Metadata (Optional)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Meta Title</label>
                      <input
                        type="text"
                        value={formData.meta_title || ''}
                        onChange={e => setFormData({...formData, meta_title: e.target.value})}
                        className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-amber"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">Meta Description</label>
                      <textarea
                        rows={2}
                        value={formData.meta_description || ''}
                        onChange={e => setFormData({...formData, meta_description: e.target.value})}
                        className="w-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 rounded-lg px-3 py-2 text-xs outline-none focus:border-brand-amber"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-neutral-100 dark:border-neutral-800 bg-white dark:bg-[#14151a] shrink-0 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-brand-amber hover:bg-brand-amber-dark text-white font-medium rounded-lg transition-colors"
                >
                  Save Page
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
