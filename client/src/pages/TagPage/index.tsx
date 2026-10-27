import React, { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react';
import PostCard from '@client/src/components/PostCard';
import SetupAlert from '@client/src/components/SetupAlert';
import ErrorAlert from '@client/src/components/ErrorAlert';
import { usePosts, useTags } from '@client/src/lib/api-hooks';
import {
  isTableNotExistError,
  extractErrorMessage,
} from '@client/src/lib/supabase';

const PAGE_SIZE = 9;

const TagPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState(1);

  const {
    data: tags,
    isLoading: tagsLoading,
    error: tagsError,
  } = useTags();

  const tag = useMemo(() => {
    if (!tags || !slug) return null;
    return tags.find((t) => t.slug === slug) || null;
  }, [tags, slug]);

  const {
    data,
    isLoading: postsLoading,
    error: postsError,
    refetch: refetchPosts,
  } = usePosts({
    page,
    pageSize: PAGE_SIZE,
    status: 'published',
    tagId: tag?.id,
  });

  const isSetupError =
    (tagsError && isTableNotExistError(tagsError)) ||
    (postsError && isTableNotExistError(postsError));
  const mainError = postsError || tagsError;

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const isLoading = tagsLoading || postsLoading;

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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-2 text-sm text-slate-500 mb-3">
              <Tag className="w-4 h-4" />
              <span>文章標籤</span>
            </div>
            {tagsLoading ? (
              <div className="h-10 w-48 bg-slate-100 rounded animate-pulse mb-2" />
            ) : tag ? (
              <h1 className="text-3xl font-bold text-slate-900 mb-2 font-serif">
                標籤：{tag.name}
              </h1>
            ) : (
              !tagsError && (
                <h1 className="text-3xl font-bold text-slate-900 mb-2 font-serif">
                  未知標籤
                </h1>
              )
            )}
            {data && (
              <p className="text-slate-600">
                共 {data.total} 篇文章
              </p>
            )}
          </div>

          {tagsError && !isTableNotExistError(tagsError) && (
            <div className="mb-6">
              <ErrorAlert
                message={extractErrorMessage(tagsError)}
              />
            </div>
          )}

          {postsError && !isTableNotExistError(postsError) && (
            <div className="mb-6">
              <ErrorAlert
                message={extractErrorMessage(postsError)}
                onRetry={() => refetchPosts()}
              />
            </div>
          )}

          {/* Not Found */}
          {!isLoading && !tag && !tagsError && (
            <div className="text-center py-16 border border-slate-200 rounded-xl bg-slate-50">
              <p className="text-slate-500 mb-4">找不到此標籤</p>
            </div>
          )}

          {/* Posts Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : tag && data && data.items.length > 0 ? (
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
          ) : tag && data ? (
            <div className="text-center py-16 border border-slate-200 rounded-xl bg-slate-50">
              <p className="text-slate-500">此標籤尚無文章</p>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
};

export default TagPage;
