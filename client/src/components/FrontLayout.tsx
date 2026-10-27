import React, { useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { Search, Menu, X, LogIn, BookOpen } from 'lucide-react';

interface FrontLayoutProps {}

const FrontLayout: React.FC<FrontLayoutProps> = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 flex flex-col">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
              <BookOpen className="w-6 h-6 text-slate-700" />
              <span>部落格</span>
            </Link>

            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-slate-600 hover:text-slate-900 transition-colors">
                首頁
              </Link>
              <Link to="/about" className="text-slate-600 hover:text-slate-900 transition-colors">
                關於
              </Link>
              {user && (
                <Link to="/admin" className="text-slate-600 hover:text-slate-900 transition-colors">
                  後台管理
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-3">
              <form onSubmit={handleSearch} className="hidden sm:flex items-center">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋文章..."
                    className="pl-9 pr-4 py-2 w-48 text-sm bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-300 focus:bg-white transition-all"
                  />
                </div>
              </form>

              {!user && (
                <Link
                  to="/admin/login"
                  className="hidden sm:inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
                >
                  <LogIn className="w-4 h-4" />
                  登入
                </Link>
              )}

              <button
                className="md:hidden p-2 -mr-2"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="選單"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-100 space-y-3">
              <form onSubmit={handleSearch} className="sm:hidden">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜尋文章..."
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </form>
              <Link
                to="/"
                className="block py-2 text-slate-700 hover:text-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                首頁
              </Link>
              <Link
                to="/about"
                className="block py-2 text-slate-700 hover:text-slate-900"
                onClick={() => setMobileMenuOpen(false)}
              >
                關於
              </Link>
              {user && (
                <Link
                  to="/admin"
                  className="block py-2 text-slate-700 hover:text-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  後台管理
                </Link>
              )}
              {!user && (
                <Link
                  to="/admin/login"
                  className="block py-2 text-slate-700 hover:text-slate-900"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  登入
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="flex-1"><Outlet /></main>

      <footer className="border-t border-slate-200 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 text-center text-sm text-slate-500">
          <p>© {new Date().getFullYear()} 部落格 / 作品集。使用 Supabase 驅動。</p>
        </div>
      </footer>
    </div>
  );
};

export default FrontLayout;
