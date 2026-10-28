import { useState, useEffect, useRef } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

interface YouTubeUploaderProps {
  onUploaded: (youtubeUrl: string) => void;
  videoTitle?: string;
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const SCOPES = 'https://www.googleapis.com/auth/youtube.upload';

export default function YouTubeUploader({ onUploaded, videoTitle }: YouTubeUploaderProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [gisLoaded, setGisLoaded] = useState(false);
  const tokenClientRef = useRef<any>(null);

  // 載入 Google Identity Services 最新官方授權庫
  useEffect(() => {
    if (!CLIENT_ID) return;
    if (window.google?.accounts?.oauth2) {
      setGisLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => setGisLoaded(true);
    document.body.appendChild(script);
  }, []);

  // 初始化授權客戶端
  useEffect(() => {
    if (!gisLoaded || !CLIENT_ID) return;

    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.access_token) {
          setAccessToken(response.access_token);
          setError('');
        } else {
          setError('授權失敗，請再試一次');
        }
      },
      error_callback: (err: any) => {
        setError(err.message || '授權過程發生錯誤');
        console.error('YouTube Auth Error:', err);
      },
    });
  }, [gisLoaded]);

  // 觸發 Google 授權（使用者主動點擊）
  const handleAuthorize = () => {
    setError('');
    if (!tokenClientRef.current) {
      setError('Google 授權服務載入中，請稍後再試');
      return;
    }
    tokenClientRef.current.requestAccessToken();
  };

  // 選擇檔案後直接上傳（原生觸發，絕對不會報 user activation 錯）
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !accessToken) return;

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      const videoUrl = await uploadVideo(file, accessToken);
      onUploaded(videoUrl);
    } catch (err: any) {
      setError(err.message || '上傳失敗');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // 直傳 YouTube Data API v3（multipart 上傳）
  const uploadVideo = (file: File, token: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const title = videoTitle || file.name.replace(/\.[^/.]+$/, '');
      const metadata = {
        snippet: {
          title,
          description: '上傳自部落格後台',
          categoryId: '22',
        },
        status: {
          privacyStatus: 'private', // 預設不公開
        },
      };

      const form = new FormData();
      form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      form.append('file', file);

      const xhr = new XMLHttpRequest();
      xhr.open(
        'POST',
        'https://www.googleapis.com/upload/youtube/v3/videos?part=snippet,status&uploadType=multipart'
      );
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const response = JSON.parse(xhr.responseText);
          resolve(`https://www.youtube.com/watch?v=${response.id}`);
        } else {
          try {
            const errRes = JSON.parse(xhr.responseText);
            reject(new Error(errRes.error?.message || '上傳失敗'));
          } catch {
            reject(new Error(`上傳失敗 (HTTP ${xhr.status})`));
          }
        }
      };

      xhr.onerror = () => reject(new Error('網路錯誤，上傳中斷'));
      xhr.send(form);
    });
  };

  if (!CLIENT_ID) {
    return (
      <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
        尚未設定 Google 上傳權限，請先設定 VITE_GOOGLE_CLIENT_ID 環境變數
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!accessToken ? (
        <button
          type="button"
          onClick={handleAuthorize}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
        >
          登入 YouTube 授權
        </button>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-green-700">✓ YouTube 授權已生效</p>
          {/* 直接顯示原生檔案選擇框，完全由使用者點擊觸發 */}
          <input
            type="file"
            accept="video/*"
            disabled={uploading}
            onChange={handleFileChange}
            className="text-sm text-gray-700 file:mr-3 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-red-600 file:text-white hover:file:bg-red-700"
          />
        </div>
      )}

      {uploading && (
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-red-600 h-2 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          <p className="text-xs text-gray-500 mt-1">已上傳 {progress}%</p>
        </div>
      )}

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
