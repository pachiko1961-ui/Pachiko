import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { upload } from '@vercel/blob/client';
import { getSupabase } from './supabase';
import type {
  WsPost, WsCategory, WsTag, PostListParams, PostListResponse,
  CreatePostRequest, UpdatePostRequest,
} from '@shared/supabase.interface';

const POST_SELECT = `
  id, title, slug, content, cover_image, youtube_url, status,
  category_id, created_at, updated_at, published_at,
  category:WS_category(id, name, slug),
  post_tags:WS_post_tag(tag:WS_tag(id, name, slug))
`;

function mapPost(raw: any): WsPost {
  const tags = raw.post_tags?.map((pt: any) => pt.tag).filter(Boolean) || [];
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    content: raw.content,
    coverImage: raw.cover_image,
    youtubeUrl: raw.youtube_url,
    status: raw.status,
    categoryId: raw.category_id,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    publishedAt: raw.published_at,
    category: raw.category || null,
    tags,
  };
}

function mapCategory(raw: any): WsCategory {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    createdAt: raw.created_at,
    postCount: raw.post_count,
  };
}

function mapTag(raw: any): WsTag {
  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    createdAt: raw.created_at,
    postCount: raw.post_count,
  };
}

export function usePosts(params: PostListParams = {}) {
  const { page = 1, pageSize = 12, status, categoryId, tagId, search } = params;
  const supabase = getSupabase();

  return useQuery<PostListResponse>({
    queryKey: ['posts', { page, pageSize, status, categoryId, tagId, search }],
    queryFn: async () => {
      let query = supabase
        .from('WS_post')
        .select(POST_SELECT, { count: 'exact' });

      if (status) {
        query = query.eq('status', status);
      }
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
      if (tagId) {
        query = query.eq('post_tags.tag_id', tagId);
      }
      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      }

      const { data, count, error } = await query
        .order('published_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (error) throw error;

      return {
        items: (data || []).map(mapPost),
        total: count || 0,
        page,
        pageSize,
      };
    },
  });
}

export function usePostBySlug(slug: string) {
  const supabase = getSupabase();

  return useQuery<WsPost | null>({
    queryKey: ['post', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('WS_post')
        .select(POST_SELECT)
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return mapPost(data);
    },
    enabled: !!slug,
  });
}

export function usePostById(id: string) {
  const supabase = getSupabase();

  return useQuery<WsPost | null>({
    queryKey: ['admin-post', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('WS_post')
        .select(POST_SELECT)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }
      return mapPost(data);
    },
    enabled: !!id,
  });
}

export function useCreatePost() {
  const supabase = getSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (req: CreatePostRequest): Promise<WsPost> => {
      const insertData = {
          title: req.title,
          slug: req.slug,
          content: req.content,
          cover_image: req.coverImage || null,
          youtube_url: req.youtubeUrl || null,
          status: req.status,
          category_id: req.categoryId || null,
          published_at: req.status === 'published' ? new Date().toISOString() : null,
        };
      const { data, error } = await supabase
        .from('WS_post')
        .insert(insertData as any)
        .select('id')
        .single();

      if (error) throw error;

      if (req.tagIds && req.tagIds.length > 0) {
        const tagRows = req.tagIds.map((tagId: string) => ({
          post_id: data!.id,
          tag_id: tagId,
        }));
        const { error: tagError } = await supabase
          .from('WS_post_tag')
          .insert(tagRows as any);
        if (tagError) throw tagError;
      }

      const { data: fullPost, error: fetchError } = await supabase
        .from('WS_post')
        .select(POST_SELECT)
        .eq('id', data!.id)
        .single();

      if (fetchError) throw fetchError;
      return mapPost(fullPost);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
    retry: false,
  });
}

export function useUpdatePost() {
  const supabase = getSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (req: UpdatePostRequest): Promise<WsPost> => {
      const updateData: Record<string, any> = {};
      if (req.title !== undefined) updateData.title = req.title;
      if (req.slug !== undefined) updateData.slug = req.slug;
      if (req.content !== undefined) updateData.content = req.content;
      if (req.coverImage !== undefined) updateData.cover_image = req.coverImage;
      if (req.youtubeUrl !== undefined) updateData.youtube_url = req.youtubeUrl;
      if (req.status !== undefined) {
        updateData.status = req.status;
        if (req.status === 'published') {
          updateData.published_at = new Date().toISOString();
        }
      }
      if (req.categoryId !== undefined) updateData.category_id = req.categoryId;

      const { error } = await supabase
        .from('WS_post')
        .update(updateData as any)
        .eq('id', req.id);

      if (error) throw error;

      if (req.tagIds !== undefined) {
        const { error: delError } = await supabase
          .from('WS_post_tag')
          .delete()
          .eq('post_id', req.id);
        if (delError) throw delError;

        if (req.tagIds.length > 0) {
            const tagRows = req.tagIds.map((tagId: string) => ({
              post_id: req.id,
              tag_id: tagId,
            }));
            const { error: insError } = await supabase
              .from('WS_post_tag')
              .insert(tagRows as any);
          if (insError) throw insError;
        }
      }

      const { data: fullPost, error: fetchError } = await supabase
        .from('WS_post')
        .select(POST_SELECT)
        .eq('id', req.id)
        .single();

      if (fetchError) throw fetchError;
      return mapPost(fullPost);
    },
    onSuccess: (_, req) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-post', req.id] });
      queryClient.invalidateQueries({ queryKey: ['post'] });
    },
    retry: false,
  });
}

export function useDeletePost() {
  const supabase = getSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('WS_post')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['admin-posts'] });
    },
    retry: false,
  });
}

export function useCategories() {
  const supabase = getSupabase();

  return useQuery<WsCategory[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('WS_category')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data || []).map(mapCategory);
    },
  });
}

export function useCreateCategory() {
  const supabase = getSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; slug: string; description?: string }) => {
      const { data: result, error } = await supabase
        .from('WS_category')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return mapCategory(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    retry: false,
  });
}

export function useUpdateCategory() {
  const supabase = getSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name?: string; slug?: string; description?: string }) => {
      const { data: result, error } = await supabase
        .from('WS_category')
        .update({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.slug !== undefined && { slug: data.slug }),
          ...(data.description !== undefined && { description: data.description }),
        })
        .eq('id', data.id)
        .select()
        .single();
      if (error) throw error;
      return mapCategory(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    retry: false,
  });
}

export function useDeleteCategory() {
  const supabase = getSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('WS_category')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
    retry: false,
  });
}

export function useTags() {
  const supabase = getSupabase();

  return useQuery<WsTag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('WS_tag')
        .select('*')
        .order('name');

      if (error) throw error;
      return (data || []).map(mapTag);
    },
  });
}

export function useCreateTag() {
  const supabase = getSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; slug: string }) => {
      const { data: result, error } = await supabase
        .from('WS_tag')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return mapTag(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    retry: false,
  });
}

export function useUpdateTag() {
  const supabase = getSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; name?: string; slug?: string }) => {
      const { data: result, error } = await supabase
        .from('WS_tag')
        .update({
          ...(data.name !== undefined && { name: data.name }),
          ...(data.slug !== undefined && { slug: data.slug }),
        })
        .eq('id', data.id)
        .select()
        .single();
      if (error) throw error;
      return mapTag(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    retry: false,
  });
}

export function useDeleteTag() {
  const supabase = getSupabase();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('WS_tag')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
    retry: false,
  });
}

export async function uploadImage(file: File): Promise<string> {
  // 過濾檔名中的特殊字元，避免產生物件路徑問題
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-');
  const filePath = `blog/${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 10)}-${safeName}`;

  // 透過 Vercel Blob 瀏覽器直傳：先向 /api/upload 取得簽章，再直接上傳
  const blob = await upload(filePath, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
  });

  return blob.url;
}

export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\w-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}
