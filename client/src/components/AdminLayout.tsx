import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tags,
  Settings,
  LogOut,
  Menu,
  X,
  BookOpen,
  Database,
} from 'lucide-react';
import { toast } from 'sonner';

const AdminLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('已登出');
      navigate('/');
    } catch (err) {
      toast.error('登出失敗');
    }
  };

  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: '文章管理', end: true },
    { to: '/admin/article/new', icon: FileText, label: '新增文章' },
    { to: '/admin/categories', icon: FolderOpen, label: '分類管理' },
    { to: '/admin/tags', icon: Tags, label: '標籤管理' },
    { to: '/admin/init-sql', icon: Database, label: 'SQL 初始化' },
    { to: '/admin/settings', icon: Settings, label: '連線設定' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar - desktop */}
      <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-slate-200 fixed h-full">
        <div className="p-5 border-b border-slate-200">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg text-slate-900">
            <BookOpen className="w-5 h-5" />
            <span>後台管理</span>
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  isActive
                    ? 'bg-slate-100 text-slate-900 font-medium'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-200">
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-slate-500">目前使用者</p>
            <p className="text-sm text-slate-800 truncate">{user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            登出
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white shadow-xl flex flex-col">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <Link to="/" className="flex items-center gap-2 font-bold text-lg text-slate-900">
                <BookOpen className="w-5 h-5" />
                <span>後台管理</span>
              </Link>
              <button onClick={() => setSidebarOpen(false)} aria-label="關閉">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg transition-colors ${
                      isActive
                        ? 'bg-slate-100 text-slate-900 font-medium'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`
                  }
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="p-3 border-t border-slate-200">
              <div className="px-3 py-2 mb-2">
                <p className="text-xs text-slate-500">目前使用者</p>
                <p className="text-sm text-slate-800 truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                登出
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 md:ml-64">
        {/* Mobile top bar */}
        <header className="md:hidden sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center">
          <button onClick={() => setSidebarOpen(true)} aria-label="開啟選單">
            <Menu className="w-6 h-6 text-slate-700" />
          </button>
          <span className="ml-3 font-medium">後台管理</span>
        </header>

        <div className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

function Link({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  return (
    <NavLink to={to} className={className}>
      {children}
    </NavLink>
  );
}

export default AdminLayout;
