import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import PostCard from '@client/src/components/PostCard';
import SetupAlert from '@client/src/components/SetupAlert';
import ErrorAlert from '@client/src/components/ErrorAlert';
import { usePosts } from '@client/src/lib/api-hooks';
import {
  isTableNotExistError,
  extractErrorMessage,
} from '@client/src/lib/supabase';

const PAGE_SIZE = 9;

const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';

  const [inputValue, setInputValue] = useState(query);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage(1);
    setInputValue(query);
  }, [query]);

  const {
    data,
    isLoading,
    error,
    refetch,
  } = usePosts({
    page,
    pageSize: PAGE_SIZE,
    status: 'published',
    search: query || undefined,
  });

  const isSetupError = error && isTableNotExistError(error);
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setSearchParams({ q: inputValue.trim() });
    } else {
      navigate('/');
    }
  };

  const SkeletonCard: React.FC = () => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="aspect-[16/9] bg-slate-100 animate-pulse" />
      <div className="p-5 space-y-3">
        <div className="flex gap-3">
          <div className="h-4 w-20 bg-slate-100 rounded animate-pulse" />
          <div className="h-4 w-16 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="h-5 w-full bg-slate-100 rounded animate-pulse" />
        <div className="h-5 w-3/4 bg-slate-100 rounded animate-pulse" />
        <div className="h-4 w-full bg-slate-100 rounded animate-pulse" />
        <div className="h-4 w-5/6 bg-slate-100 rounded animate-pulse" />
      </div>
    </div>
  );

  return (
    <>
      {isSetupError ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <SetupAlert error={extractErrorMessage(error)} />
        </div>
      ) : (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          {/* Search Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
              <Search className="w-4 h-4" />
              <span>搜尋結果</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4 font-serif">
              {query ? (
                <>
                  搜尋：「{query}」
                  {data && (
                    <span className="text-lg font-normal text-slate-500 ml-3">
                      找到 {data.total} 篇結果
                    </span>
                  )}
                </>
              ) : (
                '請輸入關鍵字進行搜尋'
              )}
            </h1>

            <form onSubmit={handleSearch} className="max-w-xl flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="輸入關鍵字..."
                  className="w-full pl-12 pr-4 py-3 bg-white border border-slate-300 rounded-full text-base focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent shadow-sm"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 bg-slate-800 text-white rounded-full font-medium hover:bg-slate-900 transition-colors"
              >
                搜尋
              </button>
            </form>
          </div>

          {error && !isTableNotExistError(error) && (
            <div className="mb-6">
              <ErrorAlert
                message={extractErrorMessage(error)}
                onRetry={() => refetch()}
              />
            </div>
          )}

          {/* Results */}
          {query && (
            <>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <SkeletonCard key={i} />
                  ))}
                </div>
              ) : data && data.items.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {data.items.map((post) => (
                      <PostCard key={post.id} post={post} />
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-10">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page <= 1}
                        className="inline-flex items-center gap-1 px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        上一頁
                      </button>
                      <span className="px-4 text-sm text-slate-600">
                        第 {page} 頁 / 共 {totalPages} 頁
                      </span>
                      <button
                        onClick={() =>
                          setPage((p) => Math.min(totalPages, p + 1))
                        }
                        disabled={page >= totalPages}
                        className="inline-flex items-center gap-1 px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        下一頁
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-16 border border-slate-200 rounded-xl bg-slate-50">
                  <Search className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 mb-2">沒有找到符合的文章</p>
                  <p className="text-sm text-slate-400">
                    試試看其他關鍵字，或者檢查是否有拼字錯誤
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default SearchPage;
