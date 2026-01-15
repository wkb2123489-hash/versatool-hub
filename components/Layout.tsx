
import React, { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TOOLS, toToolKey } from '../constants';
import { ToolCategory } from '../types';
import { useTranslation } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { getEmbedParams } from '../utils/embedEnv';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { language, setLanguage, t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const { isEmbed, isCompactEmbed } = getEmbedParams();

  useEffect(() => {
    if (!isEmbed) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    let lastHeight = 0;
    let lastSent = 0;
    let timeoutId: number | null = null;

    const sendHeight = (immediate?: boolean) => {
      const body = document.body;
      const docEl = document.documentElement;
      const rawHeight = Math.max(
        body ? body.scrollHeight : 0,
        docEl ? docEl.scrollHeight : 0,
        window.innerHeight || 0
      );

      if (!rawHeight) return;

      const height = rawHeight;
      const now = Date.now();
      const delta = now - lastSent;

      const doSend = () => {
        lastSent = Date.now();
        lastHeight = height;
        try {
          window.parent.postMessage(
            { type: 'VERSATOOL_EMBED_HEIGHT', height },
            '*'
          );
        } catch {}
      };

      if (!immediate && height === lastHeight) return;

      if (immediate || delta >= 300) {
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
          timeoutId = null;
        }
        doSend();
      } else {
        if (timeoutId !== null) {
          window.clearTimeout(timeoutId);
        }
        timeoutId = window.setTimeout(doSend, 300 - delta);
      }
    };

    const handleResize = () => {
      sendHeight();
    };

    sendHeight(true);

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined' && document.body) {
      resizeObserver = new ResizeObserver(() => {
        sendHeight();
      });
      resizeObserver.observe(document.body);
    }

    window.addEventListener('resize', handleResize);

    return () => {
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      window.removeEventListener('resize', handleResize);
      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [isEmbed]);

  const categories = [
    { key: ToolCategory.TEXT, label: t.categories.text },
    { key: ToolCategory.DEV, label: t.categories.dev },
    { key: ToolCategory.SECURITY, label: t.categories.security },
  ];

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return TOOLS;
    const query = searchQuery.toLowerCase();
    return TOOLS.filter(tool => {
      const toolTrans = t.tools[toToolKey(tool.id)] || { name: tool.name, description: tool.description };
      return (
        toolTrans.name.toLowerCase().includes(query) ||
        toolTrans.description.toLowerCase().includes(query) ||
        tool.name.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, t]);

  const isActive = (path: string) => location.pathname === path;

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  if (isEmbed) {
    return (
      <div className={`min-h-screen bg-transparent overflow-x-hidden ${isCompactEmbed ? 'p-0' : 'p-4 lg:p-6'}`}>
        <main className="w-full">
          <div className={isCompactEmbed ? 'w-full' : 'w-full max-w-5xl mx-auto'}>
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
      {/* Sidebar for Desktop */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                <i className="fas fa-toolbox text-lg"></i>
              </div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{t.appName}</h1>
            </Link>
          </div>

          {/* Search Box */}
          <div className="px-4 mb-4">
            <div className="relative group">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors text-sm"></i>
              <input 
                type="text" 
                placeholder={t.search}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-xl py-2.5 pl-9 pr-4 text-xs font-medium focus:ring-2 focus:ring-indigo-500 outline-none dark:text-slate-200"
              />
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
            {categories.map(cat => {
              const catTools = filteredTools.filter(tool => tool.category === cat.key);
              if (catTools.length === 0) return null;
              
              return (
                <div key={cat.key}>
                  <h3 className="px-3 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.1em] mb-3">
                    {cat.label}
                  </h3>
                  <div className="space-y-1">
                    {catTools.map(tool => {
                      const toolName = t.tools[toToolKey(tool.id)]?.name || tool.name;
                      return (
                        <Link
                          key={tool.id}
                          to={tool.path}
                          onClick={() => setIsSidebarOpen(false)}
                          className={`
                            flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                            ${isActive(tool.path) 
                              ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' 
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200'}
                          `}
                        >
                          <i className={`fas ${tool.icon} w-5 text-center opacity-80`}></i>
                          {toolName}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={toggleTheme}
                className="flex items-center justify-center p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                title={theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              >
                <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
              </button>
              <button 
                onClick={toggleLanguage}
                className="flex items-center justify-center p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold text-xs"
              >
                {language === 'en' ? 'CN' : 'EN'}
              </button>
            </div>
          <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-3 border border-indigo-100 dark:border-indigo-900/30">
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider mb-1">{t.wpReadyLabel}</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-indigo-700 dark:text-indigo-300 font-bold">{t.wpReadyStatus}</span>
            </div>
          </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile Header */}
        <header className="h-16 flex items-center justify-between px-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 lg:hidden sticky top-0 z-40">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            <i className="fas fa-bars text-xl"></i>
          </button>
          <div className="text-lg font-bold text-slate-800 dark:text-white">{t.appName}</div>
          <div className="flex items-center gap-1">
            <button 
              onClick={toggleLanguage}
              className="p-2 text-slate-600 dark:text-slate-400 font-bold text-xs"
            >
              {language === 'en' ? 'CN' : 'EN'}
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg"
            >
              <i className={`fas ${theme === 'light' ? 'fa-moon' : 'fa-sun'}`}></i>
            </button>
          </div>
        </header>

        {/* Overlay for mobile sidebar */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-10">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
          <footer className="max-w-6xl mx-auto mt-12 pb-8 text-center text-slate-400 dark:text-slate-600 text-sm">
            <p>{t.footerText}</p>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default Layout;
