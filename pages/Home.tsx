
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { TOOLS, toToolKey } from '../constants';
import { useTranslation } from '../LanguageContext';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const getToolTranslation = (toolId: string) => {
    const key = toToolKey(toolId);
    return t.tools[key] || { name: toolId, description: '' };
  };

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return TOOLS;
    const query = searchQuery.toLowerCase();
    return TOOLS.filter(tool => {
      const trans = getToolTranslation(tool.id);
      return (
        trans.name.toLowerCase().includes(query) ||
        trans.description.toLowerCase().includes(query) ||
        tool.name.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, t]);

  return (
    <div className="space-y-20 animate-fadeIn">
      <header className="text-center space-y-8 max-w-4xl mx-auto py-12">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2">
          <i className="fab fa-wordpress"></i> {t.wpHeroBadge}
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.05]">
          {t.homeTitlePrefix} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600 dark:from-indigo-400 dark:to-violet-400">{t.homeTitleHighlight}</span>
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto">
          {t.homeSubtitle}
        </p>

        {/* Hero Search Bar */}
        <div className="max-w-xl mx-auto relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-violet-500 rounded-3xl blur opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
          <div className="relative">
            <i className="fas fa-search absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></i>
            <input 
              type="text" 
              placeholder={t.search}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 pl-14 pr-6 text-lg shadow-xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white"
            />
          </div>
        </div>
      </header>

      {/* WordPress Value Prop Section */}
      <section className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-8 md:p-12 shadow-sm overflow-hidden relative group">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
        <div className="flex flex-col md:flex-row items-center gap-12 relative">
          <div className="flex-1 space-y-6">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">{t.wpSectionTitle}</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              {t.wpSectionDesc}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { icon: 'fa-microchip', text: t.wpProp1 },
                { icon: 'fa-shield-halved', text: t.wpProp2 },
                { icon: 'fa-code', text: t.wpProp3 },
                { icon: 'fa-mobile-screen-button', text: t.wpProp4 }
              ].map((prop, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-sm">
                    <i className={`fas ${prop.icon}`}></i>
                  </div>
                  <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{prop.text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full md:w-72 flex-shrink-0">
            <div className="p-8 bg-slate-950 rounded-3xl border border-slate-800 shadow-2xl space-y-4 transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <div className="flex items-center gap-2 mb-4">
                <i className="fab fa-wordpress text-indigo-500 text-2xl"></i>
                <span className="text-white font-bold text-xs uppercase tracking-widest">WP Integration</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full bg-slate-800 rounded"></div>
                <div className="h-2 w-3/4 bg-slate-800 rounded"></div>
                <div className="h-32 w-full bg-indigo-500/20 border border-indigo-500/30 rounded-xl flex items-center justify-center">
                   <div className="text-[10px] font-mono text-indigo-300 text-center px-4">
                     &lt;iframe src="..." embed=true /&gt;
                   </div>
                </div>
                <div className="h-2 w-1/2 bg-slate-800 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <div className="space-y-8">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3">
          <i className="fas fa-th-large text-indigo-600"></i>
          {t.exploreTools}
        </h2>
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTools.map((tool) => {
              const trans = getToolTranslation(tool.id);
              return (
                <Link 
                  key={tool.id} 
                  to={tool.path}
                  className="group p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                    <i className={`fas ${tool.icon} text-8xl -rotate-12`}></i>
                  </div>
                  
                  <div className={`w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 transition-all duration-300`}>
                    <i className={`fas ${tool.icon} text-2xl text-indigo-600 dark:text-indigo-400 group-hover:text-white`}></i>
                  </div>
                  
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-3 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{trans.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 flex-1">{trans.description}</p>
                  
                  <div className="mt-auto flex items-center text-indigo-600 dark:text-indigo-400 text-sm font-bold uppercase tracking-wider pt-4 border-t border-slate-50 dark:border-slate-800">
                    {t.openTool} 
                    <div className="ml-2 w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center group-hover:translate-x-1 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <i className="fas fa-arrow-right text-[10px]"></i>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="py-20 text-center space-y-4 bg-slate-100 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-800">
            <i className="fas fa-search text-4xl text-slate-300"></i>
            <p className="text-slate-500 font-medium">{t.noResults}</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-indigo-600 font-bold hover:underline"
            >
              {t.clear}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
