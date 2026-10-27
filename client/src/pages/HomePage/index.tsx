import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ChevronLeft, ChevronRight, FolderOpen, Tag } from 'lucide-react';
import PostCard from '@client/src/components/PostCard';
import SetupAlert from '@client/src/components/SetupAlert';
import ErrorAlert from '@client/src/components/ErrorAlert';
import { usePosts, useCategories, useTags } from '@client/src/lib/api-hooks';
import {
  isTableNotExistError,
  extractErrorMessage,
} from '@client/src/lib/supabase';

const PAGE_SIZE = 9;

const HomePage: React.FC = () => {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const {
    data,
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = usePosts({
    page,
    pageSize: PAGE_SIZE,
    status: 'published',
  });

  const {
    data: categories,
    isLoading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  const {
    data: tags,
    isLoading: tagsLoading,
    error: tagsError,
  } = useTags();

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const mainError = postsError || categoriesError || tagsError;
  const isSetupError =
    (postsError && isTableNotExistError(postsError)) ||
    (categoriesError && isTableNotExistError(categoriesError)) ||
    (tagsError && isTableNotExistError(tagsError));

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

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
      {isSetupError && mainError ? (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <SetupAlert error={extractErrorMessage(mainError)} />
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <section className="bg-gradient-to-b from-slate-50 to-white border-b border-slate-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4 font-serif">
                阿進哥在忙什麼?
              </h1>
              <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                探索技術、設計與生活的點滴，這裡記錄著關於電腦維修、
                數位創作與日常思考的文章。
              </p>
              <form
                onSubmit={handleHeroSearch}
                className="max-w-xl mx-auto flex gap-2"
              >
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="輸入關鍵字搜尋文章..."
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
          </section>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <div className="flex flex-col lg:flex-row gap-10">
              {/* Main Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-900">
                    最新文章
                  </h2>
                  {data && (
                    <span className="text-sm text-slate-500">
                      共 {data.total} 篇
                    </span>
                  )}
                </div>

                {postsError && !isTableNotExistError(postsError) && (
                  <div className="mb-6">
                    <ErrorAlert
                      message={extractErrorMessage(postsError)}
                      onRetry={() => refetchPosts()}
                    />
                  </div>
                )}

                {postsLoading ? (
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

                    {/* Pagination */}
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
                    <p className="text-slate-500">尚無文章</p>
                  </div>
                )}
              </div>

              {/* Sidebar */}
              <aside className="lg:w-72 space-y-8">
                {/* Categories */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-slate-500" />
                    文章分類
                  </h3>
                  {categoriesLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-6 bg-slate-100 rounded animate-pulse"
                        />
                      ))}
                    </div>
                  ) : categoriesError &&
                    !isTableNotExistError(categoriesError) ? (
                    <p className="text-sm text-slate-500">
                      載入分類失敗，請稍後再試
                    </p>
                  ) : categories && categories.length > 0 ? (
                    <ul className="space-y-2">
                      {categories.map((cat) => (
                        <li key={cat.id}>
                          <Link
                            to={`/category/${cat.slug}`}
                            className="flex items-center justify-between py-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
                          >
                            <span>{cat.name}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">尚無分類</p>
                  )}
                </div>

                {/* Tags */}
                <div className="bg-white border border-slate-200 rounded-xl p-5">
                  <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                    <Tag className="w-4 h-4 text-slate-500" />
                    熱門標籤
                  </h3>
                  {tagsLoading ? (
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-6 w-16 bg-slate-100 rounded-full animate-pulse"
                        />
                      ))}
                    </div>
                  ) : tagsError && !isTableNotExistError(tagsError) ? (
                    <p className="text-sm text-slate-500">
                      載入標籤失敗，請稍後再試
                    </p>
                  ) : tags && tags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <Link
                          key={tag.id}
                          to={`/tag/${tag.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 hover:text-slate-800 transition-colors"
                        >
                          <Tag className="w-3 h-3" />
                          {tag.name}
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">尚無標籤</p>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default HomePage;
