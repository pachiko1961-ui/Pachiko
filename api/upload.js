const { generateClientTokenFromReadWriteToken } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  // 只允許 POST 請求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '僅允許 POST 請求' });
  }

  try {
    // 手動讀取環境變數，確認有沒有注入
    const rwToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!rwToken) {
      return res.status(500).json({
        error: '偵測不到 BLOB_READ_WRITE_TOKEN',
        debug: {
          hasToken: false,
          hasStoreId: !!process.env.BLOB_STORE_ID,
        },
      });
    }

    // 核發客戶端上傳令牌
    const clientToken = generateClientTokenFromReadWriteToken({
      token: rwToken,
      maximumSizeInBytes: 10 * 1024 * 1024, // 單檔 10MB
      allowedContentTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
      ],
      pathPrefix: 'posts/',
    });

    return res.status(200).json({ token: clientToken });
  } catch (err) {
    return res.status(500).json({
      error: err.message || '產生上傳令牌失敗',
      debug: { errorName: err.name },
    });
  }
};
