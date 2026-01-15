
import React, { useState } from 'react';
import { useTranslation } from '../../LanguageContext';
import ToolHeader from '../../components/ToolHeader';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';

const CaseConverter: React.FC = () => {
  const [text, setText] = useState('');
  const { t } = useTranslation();
  const lt = t.tools.caseConverter;
  const { copied, trigger } = useCopyFeedback();

  const toUpperCase = () => setText(text.toUpperCase());
  const toLowerCase = () => setText(text.toLowerCase());
  
  const toSentenceCase = () => {
    if (!text) return;
    const result = text
      .toLowerCase()
      .replace(/(^\s*\w|[.!?]\s*\w|\n\s*\w)/g, (c) => c.toUpperCase());
    setText(result);
  };

  const toTitleCase = () => {
    if (!text) return;
    const result = text
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
    setText(result);
  };

  const copyToClipboard = async () => {
    if (!text) return;
    const success = await trigger(text);
    if (!success && t.copyFailed) {
      alert(t.copyFailed);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <ToolHeader 
        title={lt.name}
        description={lt.description}
        icon="fa-font"
        toolPath="/text/case"
        onClear={() => setText('')}
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-6">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t.tools.wordCounter.placeholder}
          className="w-full h-72 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all resize-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-normal leading-relaxed text-base"
        />

        <div className="flex flex-wrap gap-3">
          <button onClick={toUpperCase} className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-sm font-semibold transition-all shadow-sm">
            {lt.upper}
          </button>
          <button onClick={toLowerCase} className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-sm font-semibold transition-all shadow-sm">
            {lt.lower}
          </button>
          <button onClick={toSentenceCase} className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-sm font-semibold transition-all shadow-sm">
            {lt.sentence}
          </button>
          <button onClick={toTitleCase} className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl text-sm font-semibold transition-all shadow-sm">
            {lt.title}
          </button>
          <div className="md:flex-1"></div>
          <button 
            onClick={copyToClipboard} 
            disabled={!text}
            className="w-full md:w-auto px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
          >
            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} mr-2`}></i> {copied ? t.copied : t.copy}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseConverter;
