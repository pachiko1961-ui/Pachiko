export interface WsPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  coverImage: string | null;
  youtubeUrl: string | null;
  status: 'draft' | 'published';
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  category?: WsCategory | null;
  tags?: WsTag[];
}

export interface WsCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  createdAt: string;
  postCount?: number;
}

export interface WsTag {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  postCount?: number;
}

export interface WsPostTag {
  postId: string;
  tagId: string;
}

export type PostStatus = 'draft' | 'published';

export const POST_STATUSES = ['draft', 'published'] as const;
export const POST_STATUS_LABELS: Record<PostStatus, string> = {
  draft: '草稿',
  published: '已發布',
};

export interface PostListParams {
  page?: number;
  pageSize?: number;
  status?: PostStatus;
  categoryId?: string;
  tagId?: string;
  search?: string;
}

export interface PostListResponse {
  items: WsPost[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreatePostRequest {
  title: string;
  slug: string;
  content: string;
  coverImage?: string | null;
  youtubeUrl?: string | null;
  status: PostStatus;
  categoryId?: string | null;
  tagIds?: string[];
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: string;
}
