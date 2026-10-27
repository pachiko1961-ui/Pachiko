import React, { useState } from 'react';
import { Pencil, Trash2, Plus, Save, X, Sparkles, FolderOpen } from 'lucide-react';
import { toast } from 'sonner';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  slugify,
} from '../../../lib/api-hooks';
import {
  isTableNotExistError,
  extractErrorMessage,
} from '../../../lib/supabase';
import SetupAlert from '../../../components/SetupAlert';
import ErrorAlert from '../../../components/ErrorAlert';
import type { WsCategory } from '@shared/supabase.interface';
import { showConfirm } from '@lark-apaas/client-toolkit';

const AdminCategoriesPage: React.FC = () => {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [editDescription, setEditDescription] = useState('');

  const { data: categories = [], isLoading, error, refetch } = useCategories();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();

  const handleSlugFromName = () => {
    if (!name.trim()) {
      toast.warning('請先輸入分類名稱');
      return;
    }
    setSlug(slugify(name));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('請輸入分類名稱');
      return;
    }
    if (!slug.trim()) {
      toast.error('請輸入 Slug');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
      });
      toast.success('分類已新增');
      setName('');
      setSlug('');
      setDescription('');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const startEditing = (cat: WsCategory) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditSlug(cat.slug);
    setEditDescription(cat.description || '');
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditSlug('');
    setEditDescription('');
  };

  const handleEditSlugFromName = () => {
    if (!editName.trim()) return;
    setEditSlug(slugify(editName));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editName.trim()) {
      toast.error('請輸入分類名稱');
      return;
    }
    if (!editSlug.trim()) {
      toast.error('請輸入 Slug');
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editingId,
        name: editName.trim(),
        slug: editSlug.trim(),
        description: editDescription.trim(),
      });
      toast.success('分類已更新');
      cancelEditing();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDelete = async (cat: WsCategory) => {
    if (!await showConfirm(`確定要刪除分類「${cat.name}」嗎？`)) return;
    try {
      await deleteMutation.mutateAsync(cat.id);
      toast.success('分類已刪除');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (error && isTableNotExistError(error)) {
    return <SetupAlert error={extractErrorMessage(error)} />;
  }

  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">分類管理</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            新增分類
          </h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                名稱
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="分類名稱"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Slug
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="category-slug"
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSlugFromName}
                  className="inline-flex items-center justify-center px-2.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  title="從名稱產生"
                  aria-label="從名稱產生 slug"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                描述（選填）
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="分類描述..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              {isCreating ? '處理中...' : '新增分類'}
            </button>
          </form>
        </div>

        {/* Category list */}
        <div className="lg:col-span-2">
          {error && !isTableNotExistError(error) && (
            <div className="mb-4">
              <ErrorAlert message={extractErrorMessage(error)} onRetry={() => refetch()} />
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {isLoading ? (
              <div className="p-12 text-center text-slate-500">載入中...</div>
            ) : categories.length === 0 ? (
              <div className="p-12 text-center">
                <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">尚無分類</p>
                <p className="text-xs text-slate-400 mt-1">從左側建立第一個分類</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 font-medium text-slate-600">名稱</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">Slug</th>
                      <th className="text-left px-4 py-3 font-medium text-slate-600">文章數</th>
                      <th className="text-right px-4 py-3 font-medium text-slate-600 w-28">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((cat) => (
                      <React.Fragment key={cat.id}>
                        <tr className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {cat.name}
                            {cat.description && (
                              <p className="text-xs text-slate-500 mt-0.5 font-normal line-clamp-1">
                                {cat.description}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                            {cat.slug}
                          </td>
                          <td className="px-4 py-3 text-slate-500">
                            {cat.postCount ?? 0}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => startEditing(cat)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                                aria-label={`編輯 ${cat.name}`}
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(cat)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                                aria-label={`刪除 ${cat.name}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {editingId === cat.id && (
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <td colSpan={4} className="px-4 py-4">
                              <form onSubmit={handleUpdate} className="flex flex-col sm:flex-row gap-3 items-start sm:items-end">
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-slate-600 mb-1">
                                    名稱
                                  </label>
                                  <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 bg-white"
                                  />
                                </div>
                                <div className="w-full sm:w-48">
                                  <label className="block text-xs font-medium text-slate-600 mb-1 flex items-center justify-between">
                                    <span>Slug</span>
                                    <button
                                      type="button"
                                      onClick={handleEditSlugFromName}
                                      className="text-slate-500 hover:text-slate-700"
                                      aria-label="從名稱產生 slug"
                                    >
                                      <Sparkles className="w-3.5 h-3.5" />
                                    </button>
                                  </label>
                                  <input
                                    type="text"
                                    value={editSlug}
                                    onChange={(e) => setEditSlug(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 bg-white font-mono"
                                  />
                                </div>
                                <div className="flex-1">
                                  <label className="block text-xs font-medium text-slate-600 mb-1">
                                    描述
                                  </label>
                                  <input
                                    type="text"
                                    value={editDescription}
                                    onChange={(e) => setEditDescription(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 bg-white"
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    type="submit"
                                    disabled={isUpdating}
                                    className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 transition-colors"
                                  >
                                    <Save className="w-4 h-4" />
                                    {isUpdating ? '...' : '儲存'}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={cancelEditing}
                                    className="px-3 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              </form>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCategoriesPage;
