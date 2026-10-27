import React from 'react';
import { Mail, Globe, Github } from 'lucide-react';
import { UniversalLink } from '@lark-apaas/client-toolkit/components/UniversalLink';

const AboutPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4 font-serif">
            關於這個部落格
          </h1>
          <div className="w-16 h-1 bg-slate-800 mx-auto rounded-full" />
        </header>

        <div className="prose prose-slate prose-lg max-w-none font-serif">
          <p>
            歡迎來到這個部落格！這是一個以內容為主的多媒體部落格與作品集網站，
            記錄著關於技術、設計與生活的各種想法與探索。
          </p>

          <p>
            本站使用現代化的技術架構打造，支援 <strong>Markdown</strong> 格式撰寫文章、
            插入圖片與 <strong>YouTube 影片</strong> 等多媒體內容，
            希望能提供舒適的閱讀體驗。無論你是來找技術筆記、設計靈感還是單純隨意逛逛，
            都希望你在這裡能找到有價值的內容。
          </p>

          <h2>本站特色</h2>
          <ul>
            <li>支援 Markdown 語法撰寫，程式碼區塊語法高亮</li>
            <li>可上傳封面圖片，支援響應式圖片展示</li>
            <li>內建 YouTube 影片嵌入，方便分享多媒體內容</li>
            <li>文章分類與標籤系統，快速找到你感興趣的主題</li>
            <li>全站響應式設計，手機、平板、桌面都有良好體驗</li>
          </ul>

          <h2>關於作者</h2>
          <p>
            一位熱愛程式與設計的創作者，平時喜歡鑽研新技術、寫寫部落格、
            嘗試各種數位創作工具。相信好的內容值得被好好呈現，
            也相信分享是成長最好的方式。
          </p>
        </div>

        {/* Contact Section */}
        <section className="mt-16 p-8 bg-slate-50 border border-slate-200 rounded-2xl">
          <h2 className="text-xl font-bold text-slate-900 mb-6 font-serif">
            聯絡資訊
          </h2>
          <div className="space-y-4">
            <UniversalLink
              to="mailto:hello@example.com"
              className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <Mail className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">電子郵件</p>
                <p className="font-medium">hello@example.com</p>
              </div>
            </UniversalLink>

            <UniversalLink
              to="#"
              className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <Globe className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">個人網站</p>
                <p className="font-medium">www.example.com</p>
              </div>
            </UniversalLink>

            <UniversalLink
              to="#"
              className="flex items-center gap-3 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                <Github className="w-5 h-5 text-slate-500" />
              </div>
              <div>
                <p className="text-sm text-slate-500">GitHub</p>
                <p className="font-medium">@username</p>
              </div>
            </UniversalLink>
          </div>
        </section>
    </div>
  );
};

export default AboutPage;
