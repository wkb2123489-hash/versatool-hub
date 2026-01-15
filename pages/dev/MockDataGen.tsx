import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '../../LanguageContext';
import ToolHeader from '../../components/ToolHeader';
import {
  generateMockData,
  FIELD_DEFS,
  FieldKey,
  MockRecord,
  DEFAULT_FIELDS
} from '../../utils/mockGenerators';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';

const MockDataGen: React.FC = () => {
  const { t } = useTranslation();
  const lt = t.tools.mockGen;
  const { copied, trigger, reset: resetCopy } = useCopyFeedback();

  const [count, setCount] = useState(10);
  const [fields, setFields] = useState<Record<FieldKey, boolean>>(DEFAULT_FIELDS);
  const [result, setResult] = useState<string>('');
  const [isAutoGenerate, setIsAutoGenerate] = useState(true);

  const handleGenerate = useCallback((): MockRecord[] => {
    return generateMockData(count, fields);
  }, [count, fields]);

  useEffect(() => {
    if (!isAutoGenerate) return;

    const timeoutId = setTimeout(() => {
      const data = handleGenerate();
      setResult(JSON.stringify(data, null, 2));
    }, 200);

    return () => clearTimeout(timeoutId);
  }, [handleGenerate, isAutoGenerate]);

  const toggleField = (key: FieldKey) => {
    setFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleClear = () => {
    setResult('');
    resetCopy();
  };

  const handleCopy = () => {
    if (result) trigger(result);
  };

  const handleManualGenerate = () => {
    const data = handleGenerate();
    setResult(JSON.stringify(data, null, 2));
  };

  const fieldKeys = Object.keys(FIELD_DEFS) as FieldKey[];

  return (
    <div className="space-y-6 animate-fadeIn">
      <ToolHeader
        title={lt.name}
        description={lt.description}
        icon="fa-database"
        toolPath="/dev/mock"
        onClear={handleClear}
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isAutoGenerate}
                onChange={() => setIsAutoGenerate(!isAutoGenerate)}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
              <span className="ml-3 text-xs font-bold text-slate-500 uppercase tracking-widest">Auto</span>
            </label>
          </div>
        </div>

        <div className="space-y-8 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{lt.count}</label>
              <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold text-sm shadow-md shadow-indigo-100 dark:shadow-none">
                {count}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-widest">{lt.fields}</label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {fieldKeys.map((key) => {
                const def = FIELD_DEFS[key];
                const label = lt[def.labelKey] ?? key;
                const isActive = fields[key];

                return (
                  <label
                    key={key}
                    className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border rounded-xl cursor-pointer transition-all shadow-sm ${isActive ? 'border-indigo-400 ring-1 ring-indigo-400/20' : 'border-slate-100 dark:border-slate-800'}`}
                  >
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={() => toggleField(key)}
                      className="w-4 h-4 text-indigo-600 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-500"
                    />
                    <span
                      className={`text-xs font-bold ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      {label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {!isAutoGenerate && (
            <button
              onClick={handleManualGenerate}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-2xl text-lg font-bold shadow-xl shadow-indigo-500/20 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <i className="fas fa-sync-alt"></i> {lt.generate}
            </button>
          )}
        </div>

        <div className="relative group">
          <textarea
            value={result}
            readOnly
            className="w-full h-96 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-emerald-400 dark:text-emerald-500 font-mono text-sm leading-relaxed outline-none resize-none shadow-inner"
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              onClick={handleCopy}
              disabled={!result}
              className={`p-3 rounded-2xl transition-all shadow-lg backdrop-blur-md border ${copied ? 'bg-emerald-500 border-emerald-400 text-white' : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'}`}
            >
              <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} text-lg`}></i>
            </button>
          </div>
          {copied && (
            <div className="absolute top-16 right-4 px-3 py-1 bg-emerald-500 text-white text-[10px] font-bold rounded-lg animate-bounce shadow-lg">
              {t.copied}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MockDataGen;
