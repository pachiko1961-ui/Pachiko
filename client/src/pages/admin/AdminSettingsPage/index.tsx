import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  getSupabase,
  getSupabaseConfig,
  updateSupabaseConfig,
  extractErrorMessage,
} from '../../../lib/supabase';

const AdminSettingsPage: React.FC = () => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    const config = getSupabaseConfig();
    setUrl(config.url);
    setAnonKey(config.anonKey);
  }, []);

  useEffect(() => {
    const config = getSupabaseConfig();
    setIsDirty(url !== config.url || anonKey !== config.anonKey);
  }, [url, anonKey]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);

    try {
      // 用當前輸入的設定建立一個臨時客戶端來測試
      const { createClient } = await import('@supabase/supabase-js');
      const tempClient = createClient(url, anonKey);
      const { error } = await tempClient
        .from('WS_post')
        .select('id')
        .limit(1);

      if (error) {
        // 42P01 是 table not exist 也算連線成功（只是還沒初始化）
        if (error.code === '42P01') {
          setTestResult({
            ok: true,
            message: '連線成功！資料表尚未建立，請先執行 SQL 初始化。',
          });
        } else {
          setTestResult({
            ok: false,
            message: `連線失敗：${extractErrorMessage(error)}`,
          });
        }
      } else {
        setTestResult({
          ok: true,
          message: '連線成功！可以正常存取資料庫。',
        });
      }
    } catch (err) {
      setTestResult({
        ok: false,
        message: `連線失敗：${extractErrorMessage(err)}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!url.trim()) {
      toast.error('請輸入 Supabase URL');
      return;
    }
    if (!anonKey.trim()) {
      toast.error('請輸入 Supabase Anon Key');
      return;
    }

    updateSupabaseConfig(url.trim(), anonKey.trim());
    setIsDirty(false);
    toast.success('設定已儲存，重新整理頁面後生效');
  };

  const currentConfig = getSupabaseConfig();

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Settings className="w-7 h-7 text-slate-700" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">連線設定</h1>
        <p className="text-slate-500 text-sm">
          設定 Supabase 連線資訊，設定僅儲存在你的瀏覽器中。
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            SUPABASE_URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setTestResult(null);
            }}
            placeholder="https://your-project.supabase.co"
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
          />
          <p className="text-xs text-slate-400 mt-1.5">
            目前設定值：<code className="font-mono">{currentConfig.url}</code>
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">
            SUPABASE_ANON_KEY
          </label>
          <input
            type="text"
            value={anonKey}
            onChange={(e) => {
              setAnonKey(e.target.value);
              setTestResult(null);
            }}
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
          />
          <p className="text-xs text-slate-400 mt-1.5">
            目前設定值：
            <code className="font-mono">
              {currentConfig.anonKey.slice(0, 8)}...{currentConfig.anonKey.slice(-4)}
            </code>
          </p>
        </div>

        {testResult && (
          <div
            className={`flex items-start gap-3 p-4 rounded-lg border ${
              testResult.ok
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}
          >
            {testResult.ok ? (
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            )}
            <p
              className={`text-sm ${
                testResult.ok ? 'text-green-800' : 'text-red-700'
              }`}
            >
              {testResult.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {testing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            {testing ? '測試中...' : '測試連線'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            儲存設定
          </button>
        </div>

        {isDirty && (
          <p className="text-xs text-amber-600 text-center">
            ⚠️ 設定尚未儲存，測試按鈕會使用目前輸入的值進行測試
          </p>
        )}
      </div>

      <div className="mt-6 text-center text-xs text-slate-400">
        <p>設定儲存在瀏覽器 localStorage，更換瀏覽器或清除快取會需要重新設定。</p>
        <p className="mt-1">
          不知道如何取得？請至 Supabase Dashboard &gt; Project Settings &gt; API 查看。
        </p>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
