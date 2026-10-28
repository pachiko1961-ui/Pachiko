import { useState, useRef, useEffect } from 'react';

declare global {
  interface Window {
    gapi: any;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [gapiLoaded, setGapiLoaded] = useState(false);

  // 戴入 Google API 腳本
  useEffect(() => {
    if (!CLIENT_ID) return;
    if (window.gapi) {
      setGapiLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => setGapiLoaded(true);
    document.body.appendChild(script);

    return () => {
      // 不移除腳本，避免重複載入
    };
  }, []);

  // 初始化 Google 用戶端並檢查授權狀態
  const initGapiClient = async () => {
    if (!window.gapi) throw new Error('Google API 尚未載入');
    
    await new Promise<void>((resolve, reject) => {
      window.gapi.load('client:auth2', {
        callback: resolve,
        onerror: reject,
      });
    });

    await window.gapi.client.init({
      clientId: CLIENT_ID,
      scope: SCOPES,
      discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/youtube/v3/rest'],
    });

    const authInstance = window.gapi.auth2.getAuthInstance();
    if (authInstance.isSignedIn.get()) {
      setIsAuthorized(true);
    }
  };

  // 第一步：登入授權
  const handleAuthorize = async () => {
    setError('');
    try {
      if (!gapiLoaded) throw new Error('Google API 載入中，請稍後再試');
      if (!window.gapi.auth2) {
        await initGapiClient();
      }

      const authInstance = window.gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      if (user.isSignedIn()) {
        setIsAuthorized(true);
      } else {
        setError('授權失敗，請再試一次');
      }
    } catch (err: any) {
      setError(err.error || err.message || '授權過程發生錯誤');
      console.error('YouTube Auth Error:', err);
    }
  };

  // 第二步：選擇檔案並開始上傳
  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress(0);
    setError('');

    try {
      const videoUrl = await uploadVideo(file);
      onUploaded(videoUrl);
    } catch (err: any) {
      setError(err.message || '上傳失敗');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 執行影片上傳
  const uploadVideo = (file: File): Promise<string> => {
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
      xhr.setRequestHeader(
        'Authorization',
        `Bearer ${window.gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
      );

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
          const errRes = JSON.parse(xhr.responseText);
          reject(new Error(errRes.error?.message || '上傳失敗'));
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
      <div className="flex gap-2">
        {!isAuthorized ? (
          <button
            type="button"
            onClick={handleAuthorize}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium"
          >
            登入 YouTube 授權
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSelectFile}
            disabled={uploading}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium disabled:opacity-50"
          >
            {uploading ? '上傳中...' : '選擇影片並上傳'}
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileChange}
      />

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

      {isAuthorized && !uploading && (
        <p className="text-xs text-green-700">✓ YouTube 授權已生效</p>
      )}
    </div>
  );
}
