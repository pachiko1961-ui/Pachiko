/**
 * Vercel Blob 上傳令牌接口（Vercel Function）
 *
 * 前端上傳圖片前會先 POST 到此接口，由伺服器核發「客戶端上傳令牌」，
 * 前端拿到令牌後直接把檔案上傳到 Vercel Blob（瀏覽器直傳，不佔用函式傳輸）。
 *
 * 依賴環境變數（建立 Blob store 後自動注入）：
 *   - BLOB_READ_WRITE_TOKEN：讀寫令牌
 *   - BLOB_STORE_ID：Blob store 識別碼
 */
import { generateClientTokenFromReadWriteToken } from '@vercel/blob/client';

export async function POST(request: Request): Promise<Response> {
  // 診斷資訊：環境變數是否就緒（回傳在前端錯誤訊息中方便排查）
  const envStatus = {
    hasToken: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    hasStoreId: Boolean(process.env.BLOB_STORE_ID),
  };

  try {
    const body = await request.json().catch(() => ({}));
    const originalName = (body && (body as { filename?: string }).filename) || 'image.png';

    // 產生唯一路徑，避免檔名衝突
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '-');
    const pathname = `blog/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}-${safeName}`;

    // 核發客戶端上傳令牌：只允許圖片格式、單檔上限 10MB
    const token = await generateClientTokenFromReadWriteToken({
      pathname,
      allowedContentTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/avif',
        'image/svg+xml',
      ],
      maximumSizeInBytes: 10 * 1024 * 1024,
    });

    return Response.json({ token, pathname });
  } catch (error) {
    const message = (error as Error).message;
    return Response.json({ error: message, env: envStatus }, { status: 400 });
  }
}
