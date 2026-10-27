import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import Layout from './components/Layout';
import FrontLayout from './components/FrontLayout';
import AdminLayout from './components/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound/NotFound';

import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import CategoryPage from './pages/CategoryPage';
import TagPage from './pages/TagPage';
import SearchPage from './pages/SearchPage';
import AboutPage from './pages/AboutPage';

import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminPostsPage from './pages/admin/AdminPostsPage';
import AdminArticleEditPage from './pages/admin/AdminArticleEditPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminTagsPage from './pages/admin/AdminTagsPage';
import AdminInitSqlPage from './pages/admin/AdminInitSqlPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

import { AuthProvider } from './lib/auth-context';

const RoutesComponent = () => {
  return (
    <AuthProvider>
      <Toaster richColors position="top-right" />
      <Routes>
        {/* 前台公開頁面 */}
        <Route element={<FrontLayout />}>
          <Route index element={<HomePage />} />
          <Route path="article/:slug" element={<ArticlePage />} />
          <Route path="category/:slug" element={<CategoryPage />} />
          <Route path="tag/:slug" element={<TagPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="about" element={<AboutPage />} />
        </Route>

        {/* 後台登入（公開） */}
        <Route element={<Layout />}>
          <Route path="admin/login" element={<AdminLoginPage />} />
        </Route>

        {/* 後台管理（需登入） */}
        <Route
          path="admin"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminPostsPage />} />
          <Route path="article/new" element={<AdminArticleEditPage />} />
          <Route path="article/:id/edit" element={<AdminArticleEditPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="tags" element={<AdminTagsPage />} />
          <Route path="init-sql" element={<AdminInitSqlPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
};

export default RoutesComponent;
