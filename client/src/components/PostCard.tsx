import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Tag, FolderOpen } from 'lucide-react';
import type { WsPost } from '@shared/supabase.interface';
import { Image } from '@client/src/components/ui/image';
import { formatDate } from '@client/src/lib/utils';

interface PostCardProps {
  post: WsPost;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const dateStr = formatDate(post.publishedAt);

  const excerpt = post.content
    ? post.content.replace(/[#*`>\-\[\]]/g, '').substring(0, 120) + '...'
    : '';

  return (
    <Link
      to={`/article/${post.slug}`}
      className="group block bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-300"
    >
      {post.coverImage ? (
        <div className="aspect-[16/9] bg-slate-100 overflow-hidden">
          <Image
            src={post.coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="aspect-[16/9] bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
          <span className="text-slate-400 text-4xl font-serif italic">無封面</span>
        </div>
      )}

      <div className="p-5">
        <div className="flex items-center gap-3 mb-3 text-xs text-slate-500">
          {post.category && (
            <span className="inline-flex items-center gap-1 text-slate-600">
              <FolderOpen className="w-3.5 h-3.5" />
              {post.category.name}
            </span>
          )}
          {dateStr && (
            <span className="inline-flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {dateStr}
            </span>
          )}
        </div>

        <h2 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 group-hover:text-slate-700 transition-colors">
          {post.title}
        </h2>

        {excerpt && (
          <p className="text-sm text-slate-600 line-clamp-2 leading-relaxed mb-3">{excerpt}</p>
        )}

        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {post.tags.slice(0, 4).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-slate-100 text-slate-600 rounded-full"
              >
                <Tag className="w-3 h-3" />
                {tag.name}
              </span>
            ))}
          </div>
        )}
      </div>
    </Link>
  );
};

export default PostCard;
