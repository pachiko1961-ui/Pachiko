/**
 * YouTube 影片上傳器
 *
 * 功能：在文章編輯頁點「上傳影片到 YouTube」→ 用 Google 帳號授權 →
 * 選取本地影片檔 → 直接上傳到你的 YouTube 頻道 →
 * 完成後自動回傳 YouTube 網址（由父元件填入網址欄位）。
 *
 * 技術：Google Identity Services (OAuth2) + YouTube Data API v3 Resumable Upload
 *       （檔案由瀏覽器直傳 YouTube，不經過本站伺服器）
 *
 * 前置需求（需一次設定）：
 * 1. Google Cloud Console 建立 OAuth 用戶端 ID（Web 應用程式），
 *    授權的 JavaScript 來源加入你的網站網域（如 https://pachiko-ochre.vercel.app）
 * 2. 部署環境變數加入 VITE_GOOGLE_CLIENT_ID = 你的用戶端 ID
 *
 * 注意：上傳的影片預設「不公開（private）」，可在 YouTube Studio 改為公開。
 */
import React, { useRef, useState, useCallback } from 'react';
import { Youtube, Loader2, CheckCircle2, XCircle } from 'lucide-react';

// 從部署環境變數讀取 Google OAuth 用戶端 ID（VITE_ 前綴會自動注入到前端）
const GOOGLE_CLIENT_ID =
  (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_GOOGLE_CLIENT_ID || '';

interface YouTubeUploaderProps {
  /** 影片標題（預設使用檔名） */
  title?: string;
  /** 上傳完成後回傳 YouTube 網址 */
  onUploaded: (youtubeUrl: string) => void;
}

type UploadState =
  | { status: 'idle' }
  | { status: 'authing' }
  | { status: 'uploading'; progress: number }
  | { status: 'success'; url: string }
  | { status: 'error'; message: string };

/** 動態載入 Google Identity Services 腳本（僅需一次） */
function loadGoogleIdentity(): Promise<boolean> {
  if ((window as unknown as { google?: unknown }).google) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => resolve(Boolean((window as unknown as { google?: unknown }).google));
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * 使用 Resumable Upload 上傳影片到 YouTube
 * 流程：先初始化取得上傳網址（Location），再用 PUT 直接送檔案，並回報進度
 */
function uploadToYoutube(
  token: string,
  file: File,
  videoTitle: string,
  onProgress?: (ratio: number) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const metadata = {
      snippet: {
        title: videoTitle,
        description: '由「阿進哥在忙什麼？」部落格上傳',
        tags: [] as string[],
      },
      status: {
        privacyStatus: 'private', // 預設不公開，可在 YouTube Studio 改為公開
      },
    };

    // 第一步：初始化 resumable 上傳，取得上傳網址
    const initXhr = new XMLHttpRequest();
    initXhr.open(
      'POST',
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
    );
    initXhr.setRequestHeader('Authorization', `Bearer ${token}`);
    initXhr.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
    initXhr.onload = () => {
      if (initXhr.status >= 200 && initXhr.status < 300) {
        const uploadUrl = initXhr.getResponseHeader('Location');
        if (!uploadUrl) {
          reject(new Error('無法取得上傳網址'));
          return;
        }

        // 第二步：PUT 直接上傳檔案內容
        const upXhr = new XMLHttpRequest();
        upXhr.open('PUT', uploadUrl);
        upXhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
        upXhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable && onProgress) onProgress(ev.loaded / ev.total);
        };
        upXhr.onload = () => {
          try {
            const res = JSON.parse(upXhr.responseText) as {
              id?: string;
              error?: { message?: string };
            };
            if (upXhr.status >= 200 && upXhr.status < 300 && res.id) {
              resolve(`https://www.youtube.com/watch?v=${res.id}`);
            } else {
              reject(new Error(res.error?.message || `上傳失敗（狀態碼 ${upXhr.status}）`));
            }
          } catch {
            reject(new Error('上傳結果解析失敗'));
          }
        };
        upXhr.onerror = () => reject(new Error('上傳連線中斷，請檢查網路後重試'));
        upXhr.send(file);
      } else {
        try {
          const res = JSON.parse(initXhr.responseText) as { error?: { message?: string } };
          reject(new Error(res.error?.message || `初始化失敗（狀態碼 ${initXhr.status}）`));
        } catch {
          reject(new Error(`初始化失敗（狀態碼 ${initXhr.status}）`));
        }
      }
    };
    initXhr.onerror = () => reject(new Error('無法連線 YouTube API'));
    initXhr.send(JSON.stringify(metadata));
  });
}

export const YouTubeUploader: React.FC<YouTubeUploaderProps> = ({ title, onUploaded }) => {
  const [state, setState] = useState<UploadState>({ status: 'idle' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingTokenRef = useRef<string | null>(null);

  // 點擊按鈕：要求 Google 授權（必須由使用者點擊觸發）
  const handleClick = useCallback(async () => {
    if (!GOOGLE_CLIENT_ID) {
      setState({ status: 'error', message: '尚未設定 Google 上傳權限（VITE_GOOGLE_CLIENT_ID）' });
      return;
    }
    try {
      setState({ status: 'authing' });
      const loaded = await loadGoogleIdentity();
      if (!loaded) throw new Error('無法載入 Google 登入元件');

      const token = await new Promise<string>((resolve, reject) => {
        const g = (window as unknown as {
          google?: {
            accounts?: {
              oauth2?: {
                initTokenClient: (cfg: {
                  client_id: string;
                  scope: string;
                  callback: (resp: { access_token?: string; error?: string; error_description?: string }) => void;
                }) => { requestAccessToken: () => void };
              };
            };
          };
        }).google;
        if (!g?.accounts?.oauth2) {
          reject(new Error('Google 登入元件載入失敗'));
          return;
        }
        const client = g.accounts.oauth2.initTokenClient({
          client_id: GOOGLE_CLIENT_ID,
          scope: 'https://www.googleapis.com/auth/youtube.upload',
          callback: (resp) => {
            if (resp.access_token) {
              resolve(resp.access_token);
            } else {
              reject(new Error(resp.error_description || resp.error || 'Google 授權失敗或已取消'));
            }
          },
        });
        client.requestAccessToken();
      });

      // 授權成功 → 開啟本地檔案選擇
      pendingTokenRef.current = token;
      setState({ status: 'idle' });
      fileInputRef.current?.click();
    } catch (err) {
      setState({ status: 'error', message: (err as Error).message || 'Google 授權失敗' });
    }
  }, []);

  // 選取檔案後開始上傳
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      const token = pendingTokenRef.current;
      pendingTokenRef.current = null;
      if (!file || !token) return;
      try {
        setState({ status: 'uploading', progress: 0 });
        const url = await uploadToYoutube(token, file, title?.trim() || file.name, (ratio) =>
          setState({ status: 'uploading', progress: ratio }),
        );
        setState({ status: 'success', url });
        onUploaded(url);
      } catch (err) {
        setState({ status: 'error', message: (err as Error).message || '上傳失敗' });
      }
    },
    [title, onUploaded],
  );

  return (
    <div className="mt-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {GOOGLE_CLIENT_ID ? (
        <button
          type="button"
          onClick={handleClick}
          disabled={state.status === 'authing' || state.status === 'uploading'}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg transition-colors"
        >
          {state.status === 'authing' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              連線 Google…
            </>
          ) : state.status === 'uploading' ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              上傳中 {Math.round(state.progress * 100)}%
            </>
          ) : (
            <>
              <Youtube className="w-4 h-4" />
              上傳影片到 YouTube
            </>
          )}
        </button>
      ) : (
        <p className="text-xs text-amber-600">
          尚未設定 Google 上傳權限：請在 Vercel 環境變數加入 VITE_GOOGLE_CLIENT_ID
        </p>
      )}

      {state.status === 'uploading' && (
        <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-red-600 transition-all"
            style={{ width: `${Math.round(state.progress * 100)}%` }}
          />
        </div>
      )}

      {state.status === 'success' && (
        <p className="mt-2 text-xs text-emerald-600 inline-flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          上傳成功，YouTube 網址已自動填入（影片目前為「不公開」）
        </p>
      )}

      {state.status === 'error' && (
        <p className="mt-2 text-xs text-red-600 inline-flex items-center gap-1">
          <XCircle className="w-3.5 h-3.5" />
          {state.message}
        </p>
      )}

      <p className="mt-1 text-xs text-slate-400">
        上傳的影片會進到你的 YouTube 頻道（預設「不公開」），之後可在 YouTube Studio 改為公開
      </p>
    </div>
  );
};
