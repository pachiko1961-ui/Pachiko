const { generateClientTokenFromReadWriteToken } = require('@vercel/blob/client');

module.exports = async function handler(req, res) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '僅允許 POST 請求' });
  }

  try {
    const rwToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!rwToken) {
      return res.status(500).json({
        error: '偵測不到 BLOB_READ_WRITE_TOKEN',
        debug: { hasToken: false, hasStoreId: !!process.env.BLOB_STORE_ID },
      });
    }

    // 讀取前端傳來的檔名，產生唯一路徑（避免檔名衝突）
    let body = {};
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    } catch (e) { /* 忽略解析錯誤 */ }
    const originalName = body.filename || 'image.png';
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '-');
    const pathname = `blog/${Date.now()}-${Math.random().toString(36).substring(2, 10)}-${safeName}`;

    // 核發客戶端上傳令牌（只允許圖片、單檔 10MB）
    const token = await generateClientTokenFromReadWriteToken({
      token: rwToken,
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

    return res.status(200).json({ token, pathname });
  } catch (err) {
    return res.status(500).json({
      error: err.message || '產生上傳令牌失敗',
      debug: { errorName: err.name },
    });
  }
};
