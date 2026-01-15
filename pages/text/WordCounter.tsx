
import React, { useState } from 'react';
import { useTranslation } from '../../LanguageContext';
import ToolHeader from '../../components/ToolHeader';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';

const WordCounter: React.FC = () => {
  const [text, setText] = useState('');
  const { t } = useTranslation();
  const lt = t.tools.wordCounter;
   const { copied, trigger } = useCopyFeedback();

  const getStats = () => {
    const trimmed = text.trim();
    return {
      words: trimmed ? trimmed.split(/\s+/).length : 0,
      chars: text.length,
      charsNoSpace: text.replace(/\s/g, '').length,
      sentences: trimmed ? (text.match(/[.!?]+(\s|$)/g) || []).length : 0,
      paragraphs: trimmed ? text.split(/\n+/).filter(p => p.trim().length > 0).length : 0
    };
  };

  const stats = getStats();

  return (
    <div className="space-y-6 animate-fadeIn">
      <ToolHeader 
        title={lt.name}
        description={lt.description}
        icon="fa-list-ol"
        toolPath="/text/count"
        onClear={() => setText('')}
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: lt.words, value: stats.words },
          { label: lt.characters, value: stats.chars },
          { label: lt.sentences, value: stats.sentences },
          { label: lt.paragraphs, value: stats.paragraphs }
        ].map((item, idx) => (
          <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-center">
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{item.value}</div>
            <div className="text-xs text-slate-500 dark:text-slate-500 font-bold uppercase tracking-wider mt-1">
              {item.label}
            </div>
          </div>
        ))}
      </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={lt.placeholder}
          className="w-full h-80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all resize-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 leading-relaxed text-base"
        />

        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-400">
          <div>
            {lt.noSpaces}: <span className="font-bold text-slate-600 dark:text-slate-300">{stats.charsNoSpace}</span>
          </div>
          <button 
            onClick={async () => {
              if (!text) return;
              const success = await trigger(text);
              if (!success && t.copyFailed) {
                alert(t.copyFailed);
              }
            }}
            disabled={!text}
            className="w-full md:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
          >
            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i> {copied ? t.copied : t.copy}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WordCounter;
