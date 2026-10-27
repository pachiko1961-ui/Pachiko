export const INIT_SQL = `-- ============================================
-- WS 部落格 / 作品集網站 初始化 SQL 腳本
-- 請在 Supabase Dashboard > SQL Editor 中執行
-- ============================================

-- 1. 建立分類表
CREATE TABLE IF NOT EXISTS public."WS_category" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 建立標籤表
CREATE TABLE IF NOT EXISTS public."WS_tag" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 建立文章狀態 enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ws_post_status') THEN
    CREATE TYPE public.ws_post_status AS ENUM ('draft', 'published');
  END IF;
END$$;

-- 4. 建立文章表
CREATE TABLE IF NOT EXISTS public."WS_post" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  content TEXT NOT NULL DEFAULT '',
  cover_image TEXT,
  youtube_url TEXT,
  status public.ws_post_status NOT NULL DEFAULT 'draft',
  category_id UUID REFERENCES public."WS_category"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMptz NOT NULL DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- 5. 建立文章-標籤關聯表
CREATE TABLE IF NOT EXISTS public."WS_post_tag" (
  post_id UUID NOT NULL REFERENCES public."WS_post"(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public."WS_tag"(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);

-- 6. 建立索引
CREATE INDEX IF NOT EXISTS idx_ws_post_status ON public."WS_post"(status);
CREATE INDEX IF NOT EXISTS idx_ws_post_category_id ON public."WS_post"(category_id);
CREATE INDEX IF NOT EXISTS idx_ws_post_published_at ON public."WS_post"(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_ws_post_slug ON public."WS_post"(slug);
CREATE INDEX IF NOT EXISTS idx_ws_post_tag_post_id ON public."WS_post_tag"(post_id);
CREATE INDEX IF NOT EXISTS idx_ws_post_tag_tag_id ON public."WS_post_tag"(tag_id);
CREATE INDEX IF NOT EXISTS idx_ws_category_slug ON public."WS_category"(slug);
CREATE INDEX IF NOT EXISTS idx_ws_tag_slug ON public."WS_tag"(slug);

-- 7. 建立 updated_at 自動更新函式
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ws_post_updated_at ON public."WS_post";
CREATE TRIGGER update_ws_post_updated_at
BEFORE UPDATE ON public."WS_post"
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 8. 啟用 RLS
ALTER TABLE public."WS_post" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WS_category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WS_tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public."WS_post_tag" ENABLE ROW LEVEL SECURITY;

-- 9. 建立 RLS 原則

-- 文章：匿名使用者只能讀取已發布文章；已登入使用者可讀寫全部
DROP POLICY IF EXISTS "WS_post_select_anon_published" ON public."WS_post";
CREATE POLICY "WS_post_select_anon_published"
  ON public."WS_post" FOR SELECT
  USING (status = 'published' AND auth.role() = 'anon');

DROP POLICY IF EXISTS "WS_post_select_all_authenticated" ON public."WS_post";
CREATE POLICY "WS_post_select_all_authenticated"
  ON public."WS_post" FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "WS_post_insert_authenticated" ON public."WS_post";
CREATE POLICY "WS_post_insert_authenticated"
  ON public."WS_post" FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "WS_post_update_authenticated" ON public."WS_post";
CREATE POLICY "WS_post_update_authenticated"
  ON public."WS_post" FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "WS_post_delete_authenticated" ON public."WS_post";
CREATE POLICY "WS_post_delete_authenticated"
  ON public."WS_post" FOR DELETE
  USING (auth.role() = 'authenticated');

-- 分類：匿名可讀；已登入可寫
DROP POLICY IF EXISTS "WS_category_select_all" ON public."WS_category";
CREATE POLICY "WS_category_select_all"
  ON public."WS_category" FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "WS_category_insert_authenticated" ON public."WS_category";
CREATE POLICY "WS_category_insert_authenticated"
  ON public."WS_category" FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "WS_category_update_authenticated" ON public."WS_category";
CREATE POLICY "WS_category_update_authenticated"
  ON public."WS_category" FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "WS_category_delete_authenticated" ON public."WS_category";
CREATE POLICY "WS_category_delete_authenticated"
  ON public."WS_category" FOR DELETE
  USING (auth.role() = 'authenticated');

-- 標籤：匿名可讀；已登入可寫
DROP POLICY IF EXISTS "WS_tag_select_all" ON public."WS_tag";
CREATE POLICY "WS_tag_select_all"
  ON public."WS_tag" FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "WS_tag_insert_authenticated" ON public."WS_tag";
CREATE POLICY "WS_tag_insert_authenticated"
  ON public."WS_tag" FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "WS_tag_update_authenticated" ON public."WS_tag";
CREATE POLICY "WS_tag_update_authenticated"
  ON public."WS_tag" FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "WS_tag_delete_authenticated" ON public."WS_tag";
CREATE POLICY "WS_tag_delete_authenticated"
  ON public."WS_tag" FOR DELETE
  USING (auth.role() = 'authenticated');

-- 文章標籤關聯：匿名可讀；已登入可寫
DROP POLICY IF EXISTS "WS_post_tag_select_all" ON public."WS_post_tag";
CREATE POLICY "WS_post_tag_select_all"
  ON public."WS_post_tag" FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "WS_post_tag_insert_authenticated" ON public."WS_post_tag";
CREATE POLICY "WS_post_tag_insert_authenticated"
  ON public."WS_post_tag" FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "WS_post_tag_update_authenticated" ON public."WS_post_tag";
CREATE POLICY "WS_post_tag_update_authenticated"
  ON public."WS_post_tag" FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "WS_post_tag_delete_authenticated" ON public."WS_post_tag";
CREATE POLICY "WS_post_tag_delete_authenticated"
  ON public."WS_post_tag" FOR DELETE
  USING (auth.role() = 'authenticated');

-- 10. 建立 Storage bucket (公開讀取)
-- 注意：Supabase Storage 的 bucket 建立需透過 Dashboard 或 API 執行
-- 請至 Supabase Dashboard > Storage > New bucket
-- Bucket name: ws-images
-- 勾選 "Public bucket"
--
-- 或執行以下 SQL（需 pg_net 擴充功能）：
-- INSERT INTO storage.buckets (id, name, public) VALUES ('ws-images', 'ws-images', true);

-- 11. Storage 政策（公開讀取 + 已登入寫入）
-- 建立 bucket 後，請在 Supabase Dashboard > Storage > Policies 中設定：
-- 或執行以下 SQL：

-- 公開讀取
-- DROP POLICY IF EXISTS "ws_images_public_read" ON storage.objects;
-- CREATE POLICY "ws_images_public_read"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'ws-images');

-- 已登入使用者可上傳
-- DROP POLICY IF EXISTS "ws_images_authenticated_insert" ON storage.objects;
-- CREATE POLICY "ws_images_authenticated_insert"
--   ON storage.objects FOR INSERT
--   WITH CHECK (bucket_id = 'ws-images' AND auth.role() = 'authenticated');

-- 已登入使用者可刪除
-- DROP POLICY IF EXISTS "ws_images_authenticated_delete" ON storage.objects;
-- CREATE POLICY "ws_images_authenticated_delete"
--   ON storage.objects FOR DELETE
--   USING (bucket_id = 'ws-images' AND auth.role() = 'authenticated');

-- ============================================
-- 執行完成！請記得：
-- 1. 至 Storage 建立 ws-images bucket（設為公開）
-- 2. 在 Auth 頁面建立你的管理員帳號（Email + 密碼）
-- 3. 確認 RLS 已正確啟用
-- ============================================
`;
