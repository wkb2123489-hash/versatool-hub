
import React, { useState } from 'react';
import { useTranslation } from '../LanguageContext';
import { useTheme } from '../ThemeContext';
import { copyToClipboard } from '../utils/clipboard';
import { getEmbedParams } from '../utils/embedEnv';

interface ToolHeaderProps {
  title: string;
  description: string;
  icon: string;
  toolPath: string;
  onClear?: () => void;
}

const ToolHeader: React.FC<ToolHeaderProps> = ({ title, description, icon, toolPath, onClear }) => {
  const { t, language } = useTranslation();
  const { theme } = useTheme();
  const [showEmbed, setShowEmbed] = useState(false);

  const { isEmbed, isCompactEmbed } = getEmbedParams();

  const getEmbedCode = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const appUrl = new URL(baseUrl);
    const expectedOrigin = appUrl.origin;
    const params = new URLSearchParams();
    params.set('embed', 'true');
    if (language === 'en' || language === 'zh') {
      params.set('lang', language);
    }
    if (theme === 'light' || theme === 'dark') {
      params.set('theme', theme);
    }
    params.set('compact', '1');
    const fullUrl = `${baseUrl}?${params.toString()}#${toolPath}`;
    const iframeId = `versatool-embed-${toolPath.replace(/\//g, '-').replace(/^-+/, '')}`;
    return `<iframe id="${iframeId}" src="${fullUrl}" title="${title}" width="100%" height="700" frameborder="0" style="border:0;width:100%;display:block;overflow:hidden;" loading="lazy"></iframe>
<script>
window.addEventListener('message', function(event) {
  if (event.origin !== '${expectedOrigin}') return;
  if (!event.data || event.data.type !== 'VERSATOOL_EMBED_HEIGHT') return;
  var iframe = document.getElementById('${iframeId}');
  if (!iframe) return;
  if (typeof event.data.height === 'number') {
    iframe.style.height = event.data.height + 'px';
  }
});
</script>`;
  };

  const copyEmbed = async () => {
    const success = await copyToClipboard(getEmbedCode());
    if (success) {
      alert(t.copied);
    } else if (t.copyFailed) {
      alert(t.copyFailed);
    }
  };

  return (
    <div className={isCompactEmbed ? 'mb-4' : 'mb-8'}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
            <i className={`fas ${icon} text-2xl`}></i>
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{title}</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">{description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {!isEmbed && (
            <button 
              onClick={() => setShowEmbed(true)}
              className="flex-1 md:flex-none px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 rounded-xl text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <i className="fab fa-wordpress text-lg"></i> {t.embed}
            </button>
          )}
          {onClear && (
            <button 
              onClick={onClear}
              className="px-5 py-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all text-sm font-bold flex items-center justify-center gap-2"
            >
              <i className="fas fa-trash-alt"></i> {t.clear}
            </button>
          )}
        </div>
      </div>

      {showEmbed && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full p-8 md:p-10 space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                  <i className="fab fa-wordpress text-xl"></i>
                </div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{t.wpEmbedTitle}</h3>
              </div>
              <button onClick={() => setShowEmbed(false)} className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-sm font-bold">1</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t.wpEmbedStep1}</p>
              </div>
              <div className="flex items-start gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center flex-shrink-0 text-sm font-bold">2</div>
                <p className="text-sm text-slate-600 dark:text-slate-400">{t.wpEmbedStep2}</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.wpEmbedCodeLabel}</label>
              <div className="relative group">
                <pre className="bg-slate-900 text-indigo-300 p-6 rounded-2xl text-[12px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800 shadow-inner">
                  {getEmbedCode()}
                </pre>
                <button 
                  onClick={copyEmbed}
                  className="absolute top-4 right-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all hover:bg-indigo-500"
                >
                  <i className="fas fa-copy mr-2"></i> {t.copy}
                </button>
              </div>
            </div>

            <button 
              onClick={() => setShowEmbed(false)}
              className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolHeader;
