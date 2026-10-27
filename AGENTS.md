# 多媒體部落格 / 作品集網站

## 專案概述
一個基於 Supabase 的全功能部落格/作品集網站，包含前台瀏覽與後台管理兩部分，全部使用繁體中文介面。

## 技術架構
- **前端框架**: React 19 + TypeScript + Vite
- **樣式**: Tailwind CSS 4 + shadcn/ui
- **後端 / 資料庫 / 認證 / 儲存**: Supabase（外部服務，非平台內建資料庫）
- **Markdown 渲染**: react-markdown + remark-gfm
- **路由**: react-router-dom v7
- **狀態管理**: React Context (Auth) + @tanstack/react-query

## 設計規範

### 視覺風格
- **風格**: 現代簡約、乾淨、以內容為主的部落格風格
- **字體**: 使用系統字體堆疊，內文使用 serif 襯線字體提升閱讀體驗
- **色彩**: 簡約黑白灰為主，搭配一個重點色（深藍灰 #1e293b）
- **間距基準**: 4px（`--spacing: 0.25rem`）
- **圓角**: `--radius: 0.75rem`（較圓潤的現代風格）

### 排版
- 標題: font-bold，層級分明
- 內文: 舒適行高 (leading-relaxed)，最大閱讀寬度 65ch
- 文章內使用 `.prose` 樣式（@tailwindcss/typography）

### 響應式設計
- 桌面: 最大內容寬度 1200px，側邊欄 + 主內容
- 平板: 單欄，側邊欄移至下方
- 手機: 單欄，漢堡選單，內容全寬

## 路由結構

### 前台（公開）
- `/` - 文章列表首頁
- `/article/:id` - 單篇文章頁
- `/category/:slug` - 分類文章列表
- `/tag/:slug` - 標籤文章列表
- `/search?q=...` - 搜尋結果
- `/about` - 關於我

### 後台（需登入）
- `/admin/login` - 登入頁
- `/admin` - 儀表板 / 文章列表
- `/admin/article/new` - 新增文章
- `/admin/article/:id/edit` - 編輯文章
- `/admin/categories` - 分類管理
- `/admin/tags` - 標籤管理
- `/admin/settings` - 設定（Supabase 連線 + SQL 初始化腳本）

## 資料模型（Supabase）

### WS_post
- id (uuid, PK)
- title (varchar)
- slug (varchar, unique)
- content (text, Markdown)
- cover_image (text, URL)
- youtube_url (text)
- status (enum: draft, published)
- category_id (uuid, FK -> WS_category)
- created_at (timestamptz)
- updated_at (timestamptz)
- published_at (timestamptz, nullable)

### WS_category
- id (uuid, PK)
- name (varchar)
- slug (varchar, unique)
- description (text, nullable)
- created_at (timestamptz)

### WS_tag
- id (uuid, PK)
- name (varchar)
- slug (varchar, unique)
- created_at (timestamptz)

### WS_post_tag
- post_id (uuid, FK)
- tag_id (uuid, FK)
- PK: (post_id, tag_id)

## Supabase 設定
- SUPABASE_URL: https://zexwhzgxunfnbschkizq.supabase.co
- SUPABASE_ANON_KEY: sb_publishable_OPftLOAUJFzwKZ8eK7GIXg_2LEEMMwn
- Storage bucket: ws-images（公開讀取）

## 關鍵約定
- 所有介面文字使用繁體中文
- 日期顯示格式: YYYY-MM-DD
- 文章狀態: draft（草稿）/ published（已發布）
- 錯誤處理: 當 Supabase 查詢失敗且原因為關聯不存在時，顯示初始化指引
- 圖片上傳: 上傳至 Supabase Storage ws-images bucket，取得公開 URL
