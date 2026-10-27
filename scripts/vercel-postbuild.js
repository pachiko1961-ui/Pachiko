/**
 * Vercel 靜態部署後處理腳本
 * 1. 將入口 HTML 從 dist/client/client/index.html 移到 dist/client/index.html
 * 2. 替換 NestJS 模板佔位符，避免頁面標題顯示 {{appName}} 等字面值
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist', 'client');
const SRC_HTML = path.join(OUT_DIR, 'client', 'index.html');
const DEST_HTML = path.join(OUT_DIR, 'index.html');

// 網站名稱與描述（可依需求修改）
const APP_NAME = '阿進哥在忙什麼?';
const APP_DESC = '文字、圖片、影片一站式多媒體部落格';

function main() {
  // 1. 移動 HTML
  if (!fs.existsSync(SRC_HTML)) {
    console.error(`[vercel-postbuild] 找不到 ${SRC_HTML}，請先執行 npm run build:client`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(DEST_HTML), { recursive: true });
  fs.copyFileSync(SRC_HTML, DEST_HTML);
  fs.rmSync(path.join(OUT_DIR, 'client'), { recursive: true, force: true });
  console.log(`[vercel-postbuild] ✅ 入口 HTML 已移至 ${path.relative(ROOT, DEST_HTML)}`);

  // 2. 替換模板佔位符
  let html = fs.readFileSync(DEST_HTML, 'utf8');
  const replacements = {
    '{{appName}}': APP_NAME,
    '{{appDescription}}': APP_DESC,
    '{{appAvatar}}': '',
    '{{appId}}': '',
    '{{userId}}': '',
    '{{tenantId}}': '',
    '{{userName}}': '',
    '{{csrfToken}}': '',
    '{{environment}}': '',
    '{{basename}}': '',
    '{{{__platform__}}}': '{}',
  };
  for (const [token, value] of Object.entries(replacements)) {
    html = html.split(token).join(value);
  }
  fs.writeFileSync(DEST_HTML, html, 'utf8');
  console.log(`[vercel-postbuild] ✅ 模板佔位符已替換（站名：${APP_NAME}）`);
}

main();
