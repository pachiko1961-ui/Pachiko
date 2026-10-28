import React from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, FolderOpen, Tag } from 'lucide-react';
import SetupAlert from '@client/src/components/SetupAlert';
import ErrorAlert from '@client/src/components/ErrorAlert';
import { usePostBySlug } from '@client/src/lib/api-hooks';
import {
  isTableNotExistError,
  extractErrorMessage,
} from '@client/src/lib/supabase';
import { Markdown } from '@client/src/components/ui/markdown';
import { Image } from '@client/src/components/ui/image';
import { formatDateTime } from '@client/src/lib/utils';

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

const ArticlePage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const {
    data: post,
    isLoading,
    error,
    refetch,
  } = usePostBySlug(slug || '');

  const isSetupError = error && isTableNotExistError(error);

  const dateStr = formatDateTime(post?.publishedAt);

  const videoId = post?.youtubeUrl ? getYouTubeVideoId(post.youtubeUrl) : null;

  if (isSetupError) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
        <SetupAlert error={extractErrorMessage(error)} />
      </div>
    );
  }

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回
        </button>

        {isLoading ? (
          <div className="space-y-6">
            <div className="aspect-[21/9] bg-slate-100 rounded-xl animate-pulse" />
            <div className="h-4 w-32 bg-slate-100 rounded animate-pulse" />
            <div className="h-10 w-full bg-slate-100 rounded animate-pulse" />
            <div className="h-10 w-3/4 bg-slate-100 rounded animate-pulse" />
            <div className="space-y-3 pt-8">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-4 bg-slate-100 rounded animate-pulse"
                  style={{ width: `${60 + Math.random() * 40}%` }}
                />
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorAlert
            message={extractErrorMessage(error)}
            onRetry={() => refetch()}
          />
        ) : !post ? (
          <div className="text-center py-20">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              文章不存在
            </h2>
            <p className="text-slate-500 mb-6">
              您所查看的文章可能已被刪除或不存在
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              回到首頁
            </Link>
          </div>
        ) : (
          <>
            {/* Cover Image */}
            {post.coverImage && (
              <div className="aspect-[21/9] rounded-2xl overflow-hidden bg-slate-100 mb-8">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-6 font-serif leading-tight">
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-8 pb-8 border-b border-slate-200">
              {post.category && (
                <Link
                  to={`/category/${post.category.slug}`}
                  className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  <FolderOpen className="w-4 h-4" />
                  {post.category.name}
                </Link>
              )}
              {dateStr && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {dateStr}
                </span>
              )}
              {post.tags && post.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <Link
                      key={tag.id}
                      to={`/tag/${tag.slug}`}
                      className="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 hover:text-slate-800 transition-colors"
                    >
                      <Tag className="w-3 h-3" />
                      {tag.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* YouTube Video */}
            {videoId && (
              <div className="mb-10">
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={post.title}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </div>
            )}

            {/* Markdown Content */}
            <Markdown className="prose-slate prose-lg font-serif">{post.content}</Markdown>
          </>
        )}
    </article>
  );
};

export default ArticlePage;
