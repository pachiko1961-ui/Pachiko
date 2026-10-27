import React, { useState } from 'react';
import { Pencil, Trash2, Plus, Save, X, Sparkles, Tag as TagIcon } from 'lucide-react';
import { toast } from 'sonner';
import {
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
  slugify,
} from '../../../lib/api-hooks';
import { extractErrorMessage } from '../../../lib/supabase';
import ErrorAlert from '../../../components/ErrorAlert';
import type { WsTag } from '@shared/supabase.interface';
import { showConfirm } from '@lark-apaas/client-toolkit';

const AdminTagsPage: React.FC = () => {
  const [name, setName] = useState('');
  const [slugInput, setSlugInput] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');

  const { data: tags = [], isLoading, error, refetch } = useTags();
  const createMutation = useCreateTag();
  const updateMutation = useUpdateTag();
  const deleteMutation = useDeleteTag();

  const handleSlugFromName = () => {
    if (!name.trim()) {
      toast.warning('請先輸入標籤名稱');
      return;
    }
    setSlugInput(slugify(name));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('請輸入標籤名稱');
      return;
    }
    if (!slugInput.trim()) {
      toast.error('請輸入 Slug');
      return;
    }

    try {
      await createMutation.mutateAsync({
        name: name.trim(),
        slug: slugInput.trim(),
      });
      toast.success('標籤已新增');
      setName('');
      setSlugInput('');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const startEditing = (tag: WsTag) => {
    setEditingId(tag.id);
    setEditName(tag.name);
    setEditSlug(tag.slug);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditName('');
    setEditSlug('');
  };

  const handleEditSlugFromName = () => {
    if (!editName.trim()) return;
    setEditSlug(slugify(editName));
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    if (!editName.trim()) {
      toast.error('請輸入標籤名稱');
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
      });
      toast.success('標籤已更新');
      cancelEditing();
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const handleDelete = async (tag: WsTag) => {
    if (!await showConfirm(`確定要刪除標籤「${tag.name}」嗎？`)) return;
    try {
      await deleteMutation.mutateAsync(tag.id);
      toast.success('標籤已刪除');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const isCreating = createMutation.isPending;
  const isUpdating = updateMutation.isPending;

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-6">標籤管理</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            新增標籤
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
                placeholder="標籤名稱"
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
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  placeholder="tag-slug"
                  className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 font-mono"
                />
                <button
                  type="button"
                  onClick={handleSlugFromName}
                  className="inline-flex items-center justify-center px-2.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                  aria-label="從名稱產生 slug"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCreating}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus className="w-4 h-4" />
              {isCreating ? '處理中...' : '新增標籤'}
            </button>
          </form>
        </div>

        {/* Tag grid */}
        <div className="lg:col-span-2">
          {error && (
            <div className="mb-4">
              <ErrorAlert message={extractErrorMessage(error)} onRetry={() => refetch()} />
            </div>
          )}

          {isLoading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
              載入中...
            </div>
          ) : tags.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <TagIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">尚無標籤</p>
              <p className="text-xs text-slate-400 mt-1">從左側建立第一個標籤</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-sm transition-shadow"
                >
                  {editingId === tag.id ? (
                    <form onSubmit={handleUpdate} className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          名稱
                        </label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 bg-white"
                          autoFocus
                        />
                      </div>
                      <div>
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
                          className="w-full px-2.5 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 bg-white font-mono"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 disabled:opacity-50 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                          {isUpdating ? '...' : '儲存'}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditing}
                          className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
                          aria-label="取消編輯"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <TagIcon className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-slate-900 text-sm">
                              {tag.name}
                            </h3>
                            <p className="text-xs text-slate-400 font-mono">
                              {tag.slug}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-0.5">
                          <button
                            onClick={() => startEditing(tag)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            aria-label={`編輯 ${tag.name}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tag)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            aria-label={`刪除 ${tag.name}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        文章數：{tag.postCount ?? 0}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTagsPage;
