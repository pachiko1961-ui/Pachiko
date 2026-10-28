/**
 * Vercel Blob 上傳簽章接口（Vercel Function）
 *
 * 前端上傳圖片前會先 POST 到此接口取得上傳憑證，
 * 取得憑證後由瀏覽器直接把檔案上傳到 Vercel Blob（不佔用函式傳輸）。
 *
 * 部署前請先到 Vercel 專案後台建立 Blob Store（Public），
 * 系統會自動注入環境變數 BLOB_READ_WRITE_TOKEN 供本函式使用。
 */
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

export async function POST(request: Request): Promise<Response> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (_pathname, _clientPayload) => ({
        // 只允許圖片檔案
        allowedContentTypes: [
          'image/jpeg',
          'image/png',
          'image/webp',
          'image/gif',
          'image/avif',
          'image/svg+xml',
        ],
        // 單檔上限 10MB
        maximumSizeInBytes: 10 * 1024 * 1024,
      }),
      onUploadCompleted: async () => {
        // 上傳完成後的記錄（可留空）
      },
    });

    return Response.json(jsonResponse);
  } catch (error) {
    return Response.json(
      { error: (error as Error).message },
      { status: 400 }
    );
  }
}
