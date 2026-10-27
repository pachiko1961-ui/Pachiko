import React from 'react';
import { AlertTriangle, Database, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SetupAlertProps {
  error?: string;
}

const SetupAlert: React.FC<SetupAlertProps> = ({ error }) => {
  return (
    <div className="max-w-2xl mx-auto my-12">
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
          <Database className="w-8 h-8 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-amber-900 mb-2">資料庫尚未初始化</h2>
        <p className="text-amber-800 mb-4">
          系統偵測到資料表尚未建立，請先至後台執行初始化 SQL 腳本。
        </p>
        {error && (
          <div className="bg-white/60 rounded-lg p-3 mb-4 text-left">
            <p className="text-xs text-amber-700 font-mono break-all">{error}</p>
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/admin/init-sql"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
          >
            前往初始化頁面
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/admin/settings"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-white text-amber-700 border border-amber-300 rounded-lg hover:bg-amber-50 transition-colors"
          >
            確認連線設定
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SetupAlert;
