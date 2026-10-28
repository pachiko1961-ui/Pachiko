import { generateClientToken } from '@vercel/blob';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // 核發客戶端上傳令牌：限制圖片格式、單檔 10MB、統一放在 posts 目錄
    const clientToken = generateClientToken({
      maximumSizeInBytes: 10 * 1024 * 1024,
      allowedContentTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ],
      pathPrefix: 'posts/',
    });

    return res.status(200).json({
      token: clientToken,
    });
  } catch (err: any) {
    return res.status(400).json({
      error: err?.message || 'Failed to generate upload token',
    });
  }
}
