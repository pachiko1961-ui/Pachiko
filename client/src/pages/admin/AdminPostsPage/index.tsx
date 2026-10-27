import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePosts, useDeletePost } from '../../../lib/api-hooks';
import {
  isTableNotExistError,
  extractErrorMessage,
} from '../../../lib/supabase';
import SetupAlert from '../../../components/SetupAlert';
import ErrorAlert from '../../../components/ErrorAlert';
import {
  POST_STATUSES,
  POST_STATUS_LABELS,
  type PostStatus,
} from '@shared/supabase.interface';
import { showConfirm } from '@lark-apaas/client-toolkit';

const PAGE_SIZE = 10;

const AdminPostsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = Number(searchParams.get('page') || '1');
  const statusParam = searchParams.get('status') || '';
  const searchParam = searchParams.get('search') || '';

  const [searchInput, setSearchInput] = useState(searchParam);

  const { data, isLoading, error, refetch } = usePosts({
    page,
    pageSize: PAGE_SIZE,
    status: statusParam ? (statusParam as PostStatus) : undefined,
    search: searchParam || undefined,
  });

  const deleteMutation = useDeletePost();

  const handleStatusChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set('status', value);
    else next.delete('status');
    next.delete('page');
    setSearchParams(next);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (searchInput.trim()) next.set('search', searchInput.trim());
    else next.delete('search');
    next.delete('page');
    setSearchParams(next);
  };

  const goToPage = (p: number) => {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(p));
    setSearchParams(next);
  };

  const handleDelete = async (id: string, title: string) => {
    if (!await showConfirm(`確定要刪除文章「${title}」嗎？此操作無法復原。`)) {
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('文章已刪除');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  if (error && isTableNotExistError(error)) {
    return <SetupAlert error={extractErrorMessage(error)} />;
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-slate-900">文章管理</h1>
        <Link
          to="/admin/article/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新增文章
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="搜尋文章標題或內容..."
            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
          />
        </form>
        <div className="w-full sm:w-48">
          <select
            value={statusParam}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 bg-white"
          >
            <option value="">全部狀態</option>
            {POST_STATUSES.map((s) => (
              <option key={s} value={s}>
                {POST_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && !isTableNotExistError(error) && (
        <div className="mb-6">
          <ErrorAlert message={extractErrorMessage(error)} onRetry={() => refetch()} />
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-slate-500">載入中...</div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">尚無文章</p>
            <Link
              to="/admin/article/new"
              className="inline-flex items-center gap-2 mt-4 text-sm text-slate-900 font-medium hover:underline"
            >
              <Plus className="w-4 h-4" />
              建立第一篇文章
            </Link>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left px-4 py-3 font-medium text-slate-600">標題</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 w-28">狀態</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 w-32">分類</th>
                    <th className="text-left px-4 py-3 font-medium text-slate-600 w-36">發布日期</th>
                    <th className="text-right px-4 py-3 font-medium text-slate-600 w-32">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((post) => (
                    <tr
                      key={post.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/admin/article/${post.id}/edit`)}
                          className="text-left font-medium text-slate-900 hover:text-slate-700 hover:underline"
                        >
                          {post.title}
                        </button>
                        <p className="text-xs text-slate-400 mt-0.5 font-mono">
                          /{post.slug}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
                            post.status === 'published'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {POST_STATUS_LABELS[post.status]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {post.category?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">
                        {post.publishedAt
                          ? new Date(post.publishedAt).toISOString().slice(0, 10)
                          : post.createdAt
                            ? new Date(post.createdAt).toISOString().slice(0, 10)
                            : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/admin/article/${post.id}/edit`)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                            aria-label={`編輯 ${post.title}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(post.id, post.title)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            aria-label={`刪除 ${post.title}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
                <p className="text-sm text-slate-500">
                  共 {data.total} 篇，第 {data.page} / {totalPages} 頁
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(page - 1)}
                    disabled={page <= 1}
                    className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="上一頁"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => goToPage(p)}
                      className={`min-w-8 h-8 px-2 text-sm rounded-md transition-colors ${
                        p === page
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => goToPage(page + 1)}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-md border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="下一頁"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPostsPage;
