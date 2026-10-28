import { put } from '@vercel/blob';

/**
 * 上傳圖片到 Vercel Blob（瀏覽器直傳）
 * @param file 圖片檔案
 * @returns 公開圖片網址
 */
export async function uploadImage(file: File): Promise<string> {
  try {
    // 向後台取得上傳令牌
    const tokenRes = await fetch('/api/upload', { method: 'POST' });
    if (!tokenRes.ok) {
      const errData = await tokenRes.json().catch(() => ({}));
      throw new Error(errData.error || '取得上傳權限失敗');
    }
    const { token } = await tokenRes.json();

    // 瀏覽器直接上傳到 Vercel Blob
    const result = await put(file.name, file, {
      token,
      access: 'public',
    });

    return result.url;
  } catch (err: any) {
    console.error('VERCEL BLOB UPLOAD ERROR:', err);
    throw new Error(err.message || '圖片上傳失敗');
  }
}
