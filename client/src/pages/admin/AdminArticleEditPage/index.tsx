import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Upload, X, Image as ImageIcon,
  Sparkles, Save, Eye, Edit3, Plus, Tag as TagIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import {
  usePostById, useCreatePost, useUpdatePost,
  useCategories, useTags, useCreateTag,
  uploadImage, slugify,
} from '../../../lib/api-hooks';
import { extractErrorMessage } from '../../../lib/supabase';
import ErrorAlert from '../../../components/ErrorAlert';
import {
  POST_STATUSES,
  POST_STATUS_LABELS,
  type PostStatus,
  type WsTag,
} from '@shared/supabase.interface';
import { Image } from '@client/src/components/ui/image';

type ViewMode = 'edit' | 'preview' | 'split';

const AdminArticleEditPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<PostStatus>('draft');
  const [categoryId, setCategoryId] = useState<string>('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [isUploading, setIsUploading] = useState(false);

  // New tag form
  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  const { data: post, isLoading: postLoading, error: postError } = usePostById(id || '');
  const { data: categories = [] } = useCategories();
  const { data: tags = [], refetch: refetchTags } = useTags();
  const createMutation = useCreatePost();
  const updateMutation = useUpdatePost();
  const createTagMutation = useCreateTag();

  // Load post data in edit mode
  useEffect(() => {
    if (isEditMode && post) {
      setTitle(post.title);
      setSlug(post.slug);
      setCoverImage(post.coverImage);
      setYoutubeUrl(post.youtubeUrl || '');
      setContent(post.content);
      setStatus(post.status);
      setCategoryId(post.categoryId || '');
      setSelectedTagIds(post.tags?.map((t: WsTag) => t.id) || []);
    }
  }, [isEditMode, post]);

  const handleSlugFromTitle = () => {
    if (!title.trim()) {
      toast.warning('請先輸入標題');
      return;
    }
    setSlug(slugify(title));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('請上傳圖片檔案');
      return;
    }

    setIsUploading(true);
    try {
      const url = await uploadImage(file);
      setCoverImage(url);
      toast.success('封面圖片上傳成功');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveCover = () => {
    setCoverImage(null);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((tid) => tid !== tagId)
        : [...prev, tagId]
    );
  };

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newTagName.trim();
    if (!name) return;

    try {
      const newTag = await createTagMutation.mutateAsync({
        name,
        slug: slugify(name),
      });
      setSelectedTagIds((prev) => [...prev, newTag.id]);
      setNewTagName('');
      setShowNewTag(false);
      refetchTags();
      toast.success('標籤已新增');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const getYoutubeEmbedUrl = (url: string): string | null => {
    if (!url) return null;
    const match = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
    );
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const youtubeEmbed = getYoutubeEmbedUrl(youtubeUrl);

  const handleSubmit = async (targetStatus: PostStatus) => {
    if (!title.trim()) {
      toast.error('請輸入文章標題');
      return;
    }
    if (!slug.trim()) {
      toast.error('請輸入 Slug');
      return;
    }

    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      content,
      coverImage: coverImage || null,
      youtubeUrl: youtubeUrl.trim() || null,
      status: targetStatus,
      categoryId: categoryId || null,
      tagIds: selectedTagIds,
    };

    try {
      if (isEditMode && id) {
        await updateMutation.mutateAsync({ id, ...payload });
        toast.success(targetStatus === 'published' ? '文章已發布' : '草稿已儲存');
      } else {
        await createMutation.mutateAsync(payload);
        toast.success(targetStatus === 'published' ? '文章已發布' : '草稿已儲存');
      }
      navigate('/admin');
    } catch (err) {
      toast.error(extractErrorMessage(err));
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && postLoading) {
    return <div className="p-12 text-center text-slate-500">載入中...</div>;
  }

  if (isEditMode && postError) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <ErrorAlert message={extractErrorMessage(postError)} />
      </div>
    );
  }

  if (isEditMode && !post) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-500">找不到此文章</p>
        <button
          onClick={() => navigate('/admin')}
          className="mt-4 text-slate-900 underline text-sm"
        >
          返回列表
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/admin')}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          返回文章列表
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/admin')}
            className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => handleSubmit('draft')}
            disabled={isSaving || isUploading}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSaving ? '處理中...' : '儲存草稿'}
          </button>
          <button
            onClick={() => handleSubmit('published')}
            disabled={isSaving || isUploading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {isSaving ? '處理中...' : '發布'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              文章標題
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="輸入文章標題..."
              className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-lg font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
            />
          </div>

          {/* Content editor */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50">
              <span className="text-sm font-medium text-slate-700">文章內容 (Markdown)</span>
              <div className="flex bg-white rounded-md border border-slate-200 p-0.5">
                <button
                  onClick={() => setViewMode('edit')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded ${
                    viewMode === 'edit' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  編輯
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded ${
                    viewMode === 'split' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
                  }`}
                >
                  左右分割
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded ${
                    viewMode === 'preview' ? 'bg-slate-100 text-slate-900' : 'text-slate-500'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  預覽
                </button>
              </div>
            </div>

            <div className={`${viewMode === 'split' ? 'grid grid-cols-1 md:grid-cols-2' : ''}`}>
              {(viewMode === 'edit' || viewMode === 'split') && (
                <div className={viewMode === 'split' ? 'border-r border-slate-200' : ''}>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="# 開始寫作...&#10;&#10;支援 Markdown 語法"
                    className="w-full h-96 p-4 text-sm font-mono resize-none focus:outline-none leading-relaxed"
                  />
                </div>
              )}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className="h-96 overflow-auto p-4 prose prose-slate max-w-none text-sm">
                  {content ? (
                    <ReactMarkdown>{content}</ReactMarkdown>
                  ) : (
                    <p className="text-slate-400 italic">預覽區域</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Slug */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Slug
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="文章-slug"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 font-mono"
              />
              <button
                type="button"
                onClick={handleSlugFromTitle}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                從標題產生
              </button>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              狀態
            </label>
            <div className="flex gap-2">
              {POST_STATUSES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    status === s
                      ? s === 'published'
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-slate-100 border-slate-300 text-slate-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {POST_STATUS_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          {/* Cover image */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              封面圖片
            </label>
            {coverImage ? (
              <div className="relative group">
                <Image
                  src={coverImage}
                  alt="封面"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="移除封面"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="w-full h-40 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center text-slate-400">
                <ImageIcon className="w-8 h-8 mb-2" />
                <p className="text-xs">尚未上傳封面</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full mt-3 inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              {isUploading ? '上傳中...' : '上傳封面圖片'}
            </button>
          </div>

          {/* YouTube */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              YouTube 網址
            </label>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
            />
            {youtubeEmbed && (
              <div className="mt-3 aspect-video rounded-lg overflow-hidden bg-black">
                <iframe
                  src={youtubeEmbed}
                  title="YouTube 預覽"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            {youtubeUrl && !youtubeEmbed && (
              <p className="text-xs text-amber-600 mt-2">YouTube 網址格式不正確</p>
            )}
          </div>

          {/* Category */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              分類
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900 bg-white"
            >
              <option value="">未分類</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-700">
                標籤
              </label>
              <button
                type="button"
                onClick={() => setShowNewTag((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900"
              >
                <Plus className="w-3.5 h-3.5" />
                新增標籤
              </button>
            </div>

            {showNewTag && (
              <form onSubmit={handleCreateTag} className="mb-3 flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="標籤名稱"
                  className="flex-1 px-2 py-1.5 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-md hover:bg-slate-800"
                >
                  新增
                </button>
              </form>
            )}

            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <p className="text-xs text-slate-400">尚無標籤，點擊上方新增</p>
              ) : (
                tags.map((tag) => {
                  const isSelected = selectedTagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded-full border transition-colors ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <TagIcon className="w-3 h-3" />
                      {tag.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminArticleEditPage;
