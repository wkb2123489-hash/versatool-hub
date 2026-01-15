
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from '../../LanguageContext';
import ToolHeader from '../../components/ToolHeader';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';

const JSONFormatter: React.FC = () => {
  const [json, setJson] = useState('');
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const lt = t.tools.jsonFormatter;
  const { copied, trigger } = useCopyFeedback();

  // Use a ref to capture the latest json value for stable callbacks
  const jsonRef = useRef(json);
  useEffect(() => {
    jsonRef.current = json;
  }, [json]);

  // Optimized parse and set logic to avoid race conditions and closure staleness
  const parseAndSetJSON = useCallback((transformFn: (obj: any) => string) => {
    const source = jsonRef.current; // Snapshot of current state
    if (!source.trim()) return;
    
    // Non-blocking parse
    setTimeout(() => {
      try {
        const parsed = JSON.parse(source);
        // Functional update ensures we only update if the user hasn't typed something else
        setJson(prev => (prev === source ? transformFn(parsed) : prev));
        setError('');
      } catch (e) {
        setError(
          e instanceof SyntaxError 
            ? `${lt.invalidJson} ${e.message}` 
            : lt.unknownError
        );
      }
    }, 0);
  }, [lt]);

  // Recursive key sorting function
  const sortKeys = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(sortKeys);
    } else if (obj !== null && typeof obj === 'object') {
      return Object.keys(obj)
        .sort()
        .reduce((acc, key) => {
          acc[key] = sortKeys(obj[key]);
          return acc;
        }, {} as any);
    }
    return obj;
  };

  const formatJSON = useCallback((spaces: number = 2) =>
    parseAndSetJSON(obj => JSON.stringify(obj, null, spaces)), [parseAndSetJSON]);

  const minifyJSON = useCallback(() =>
    parseAndSetJSON(obj => JSON.stringify(obj)), [parseAndSetJSON]);

  const applySortKeys = useCallback(() =>
    parseAndSetJSON(obj => JSON.stringify(sortKeys(obj), null, 2)), [parseAndSetJSON]);

  // Safer Smart Fix strategy: structural fixes only, avoiding risky quote replacements
  const smartFix = useCallback(() => {
    const source = jsonRef.current;
    let fixed = source
      .replace(/,\s*([\]}])/g, '$1') // Fix trailing commas
      .replace(/([{,]\s*)([a-zA-Z_$][\w$]*)\s*:/g, '$1"$2":'); // Fix unquoted keys

    try {
      const parsed = JSON.parse(fixed);
      setJson(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (e) {
      setError(lt.invalidJson);
    }
  }, [lt.invalidJson]);

  // Keyboard Shortcuts: Optimized to avoid rebinding on every keystroke
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey)) {
        if (e.key === 'Enter') {
          e.preventDefault();
          formatJSON(2);
        } else if (e.shiftKey && e.key.toLowerCase() === 'm') {
          e.preventDefault();
          minifyJSON();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [formatJSON, minifyJSON]);

  const handleCopy = async () => {
    if (!json) return;
    const success = await trigger(json);
    if (!success) {
      setError(t.copyFailed);
    }
  };

  // Derived statistics
  const stats = useMemo(() => {
    if (!json) return null;
    const chars = json.length;
    const kb = (chars / 1024).toFixed(2);
    return { chars, kb };
  }, [json]);

  return (
    <div className="space-y-6 animate-fadeIn">
      <ToolHeader 
        title={lt.name}
        description={lt.description}
        icon="fa-code"
        toolPath="/dev/json"
        onClear={() => {setJson(''); setError('');}}
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-6">
        <div className="relative group">
          <textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='{"key": "value"}'
            className="w-full h-[500px] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all resize-none bg-slate-950 text-indigo-300 dark:text-indigo-400 font-mono text-sm leading-relaxed shadow-inner"
          />
          
          {stats && (
            <div className="absolute bottom-4 right-4 flex items-center gap-3 px-3 py-1.5 bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest pointer-events-none">
              <span>{lt.chars}: {stats.chars}</span>
              <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
              <span>{lt.size}: {stats.kb} KB</span>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-xs flex items-center gap-3">
            <i className="fas fa-exclamation-circle text-lg"></i> {error}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <button 
            disabled={!json}
            onClick={() => formatJSON(2)} 
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-indigo-100 dark:shadow-none active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Ctrl+Enter"
          >
            {lt.prettify2}
          </button>
          <button 
            disabled={!json}
            onClick={() => formatJSON(4)} 
            className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50"
          >
            {lt.prettify4}
          </button>
          <button 
            disabled={!json}
            onClick={minifyJSON} 
            className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50"
            title="Ctrl+Shift+M"
          >
            {lt.minify}
          </button>
          <button 
            disabled={!json}
            onClick={applySortKeys} 
            className="px-5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all hover:text-indigo-600 dark:hover:text-indigo-400 disabled:opacity-50"
          >
            <i className="fas fa-sort-alpha-down mr-2 opacity-60"></i>{lt.sortKeys}
          </button>
          <button 
            disabled={!json}
            onClick={smartFix} 
            className="px-5 py-2.5 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/50 text-emerald-600 dark:text-emerald-400 rounded-xl text-sm font-bold transition-all hover:bg-emerald-100 dark:hover:bg-emerald-900/20 disabled:opacity-50"
          >
            <i className="fas fa-wand-magic-sparkles mr-2 opacity-60"></i>{lt.smartFix}
          </button>

          <div className="md:flex-1"></div>

          <div className="relative">
            <button 
              onClick={handleCopy}
              disabled={!json}
              className={`w-full md:w-auto px-8 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 ${
                copied 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-slate-800 dark:bg-indigo-900/40 text-white dark:text-indigo-300 border dark:border-indigo-800/50'
              }`}
            >
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
              {copied ? t.copied : t.copy}
            </button>
            {copied && (
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded shadow-lg animate-bounce">
                {t.copied}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JSONFormatter;
