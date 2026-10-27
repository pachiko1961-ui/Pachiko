import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Check, Database, HardDrive, UserPlus, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { INIT_SQL } from '../../../lib/init-sql';

const AdminInitSqlPage: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INIT_SQL);
      setCopied(true);
      toast.success('SQL 腳本已複製到剪貼簿');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('複製失敗，請手動複製');
    }
  };

  const steps = [
    {
      icon: Database,
      title: '建立資料表',
      desc: '在 Supabase SQL Editor 執行下方 SQL 腳本，建立文章、分類、標籤等資料表與 RLS 原則。',
    },
    {
      icon: HardDrive,
      title: '建立 Storage Bucket',
      desc: '至 Supabase Storage 建立名為 ws-images 的公開 Bucket，用於存放封面圖片。',
    },
    {
      icon: UserPlus,
      title: '建立管理員帳號',
      desc: '至 Supabase Authentication 建立你的管理員 Email / 密碼，或直接在後台註冊。',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">SQL 初始化設定</h1>
        <p className="text-slate-500">
          第一次使用請依序完成以下步驟，建立完整的部落格資料結構。
        </p>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {steps.map((step, index) => (
          <div
            key={index}
            className="bg-white border border-slate-200 rounded-xl p-5 relative"
          >
            <div className="absolute -top-3 -left-3 w-7 h-7 bg-slate-900 text-white text-sm font-bold rounded-full flex items-center justify-center">
              {index + 1}
            </div>
            <step.icon className="w-8 h-8 text-slate-700 mb-3" />
            <h3 className="font-semibold text-slate-900 mb-1.5">{step.title}</h3>
            <p className="text-sm text-slate-500 leading-relaxed">{step.desc}</p>
          </div>
        ))}
      </div>

      {/* SQL Code block */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">初始化 SQL 腳本</span>
          </div>
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-100 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-green-600" />
                已複製
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                複製全部
              </>
            )}
          </button>
        </div>
        <div className="bg-slate-900 p-4 overflow-auto max-h-[500px]">
          <pre className="text-xs text-slate-200 font-mono leading-relaxed whitespace-pre">
            {INIT_SQL}
          </pre>
        </div>
      </div>

      {/* Storage info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center shrink-0">
            <HardDrive className="w-5 h-5 text-blue-700" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">Storage Bucket 設定</h3>
            <p className="text-sm text-blue-800 mb-3">
              請至 Supabase Dashboard &gt; Storage 建立以下設定：
            </p>
            <ul className="space-y-2 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 shrink-0" />
                <span>
                  Bucket 名稱：<code className="px-1.5 py-0.5 bg-blue-100 rounded text-xs font-mono">ws-images</code>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 shrink-0" />
                <span>勾選「Public bucket」（公開讀取）</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="w-4 h-4 shrink-0" />
                <span>上傳政策：已登入使用者可上傳與刪除</span>
              </li>
            </ul>
            <p className="text-xs text-blue-600 mt-4">
              ⚠️ 請確認 SQL 腳本中第 10 節的 Storage 政策也一併執行。
            </p>
          </div>
        </div>
      </div>

      {/* Admin account info */}
      <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5 text-green-700" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-2">管理員帳號</h3>
            <p className="text-sm text-green-800">
              你可以直接在
              <Link to="/admin/login" className="font-medium underline mx-1">
                後台登入頁
              </Link>
              點擊「註冊」建立你的管理員帳號。或者到 Supabase Dashboard &gt; Authentication 手動建立。
            </p>
            <p className="text-xs text-green-600 mt-3">
              💡 預設情況下，所有註冊的使用者都可以登入後台。如果需要限制存取，請在 Supabase 中設定規則。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInitSqlPage;
