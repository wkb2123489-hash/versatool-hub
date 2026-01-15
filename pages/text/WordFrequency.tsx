
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '../../LanguageContext';
import ToolHeader from '../../components/ToolHeader';

type WordFrequencyStat = {
  item: string;
  count: number;
  percentage: string;
};

const WordFrequency: React.FC = () => {
  const { t, language } = useTranslation();
  const lt = t.tools.wordFrequency;
  const [text, setText] = useState('');
  const [mode, setMode] = useState<'word' | 'char'>('word');
  const [limit, setLimit] = useState(20);
  const [stats, setStats] = useState<WordFrequencyStat[]>([]);
  const [engine, setEngine] = useState('Idle');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // 任务标识符，用于取消过期任务
  const currentRunId = useRef(0);

  /**
   * 优化后的西文分词器：处理缩写、数字和基础标点
   */
  const westernTokenizer = (input: string): string[] => {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9\s']/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0 && !/^\d+$/.test(w)); // 过滤纯数字和空白
  };

  /**
   * 检查是否包含中日韩字符
   */
  const containsCJK = (str: string) => /[\u4e00-\u9fa5]/.test(str);

  useEffect(() => {
    const runId = ++currentRunId.current;
    
    const analyzeText = async () => {
      if (!text.trim()) {
        if (runId === currentRunId.current) {
          setStats([]);
          setEngine('Idle');
        }
        return;
      }

      setIsAnalyzing(true);
      let tokens: string[] = [];
      let activeEngine = 'Basic';

      // 1. 字符模式处理 (不分引擎，直接处理)
      if (mode === 'char') {
        activeEngine = 'Character-Level';
        // Explicitly typed to avoid 'never' inference on the result of replace()
        const cleanedText: string = text.replace(/[\s\n\r\p{P}\p{S}]/gu, '');
        tokens = cleanedText.split('');
      } 
      // 2. 单词/分词模式处理
      else {
        if ('Segmenter' in Intl) {
          activeEngine = 'Standard (Intl)';
          const segmenter = new (Intl as any).Segmenter(language === 'zh' ? 'zh-CN' : 'en-US', { 
            granularity: 'word' 
          });
          const segments = segmenter.segment(text);
          
          for (const { segment, isWordLike } of segments) {
            if (isWordLike) {
              if (containsCJK(segment)) {
                tokens.push(segment); // CJK 字符直接作为词元
              } else {
                tokens.push(...westernTokenizer(segment)); // 西文进一步清洗
              }
            }
          }
        } else {
          activeEngine = 'Basic (Regex)';
          const parts: string[] = text.match(/([\u4e00-\u9fa5]+|[\w']+|[^\s\w\u4e00-\u9fa5]+)/gu) || [];
          parts.forEach((part: string) => {
            if (containsCJK(part)) {
              tokens.push(...part.split(''));
            } else if (/[\w']/.test(part)) {
              tokens.push(...westernTokenizer(part));
            }
          });
        }
      }

      // 统计逻辑
      const freqMap: Record<string, number> = {};
      tokens.forEach(token => {
        if (!token || token.length < 1) return;
        freqMap[token] = (freqMap[token] || 0) + 1;
      });

      const total = Object.values(freqMap).reduce((a, b) => a + b, 0);
      const result = Object.entries(freqMap)
        .map(([item, count]) => ({
          item,
          count,
          percentage: ((count / total) * 100).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      // 仅在任务 ID 匹配时更新 UI
      if (runId === currentRunId.current) {
        setStats(result);
        setEngine(activeEngine);
        setIsAnalyzing(false);
      }
    };

    const timer = setTimeout(analyzeText, 350); // 略微增加防抖时间以平衡性能
    return () => clearTimeout(timer);
  }, [text, mode, limit, language]);

  const maxCount = stats.length > 0 ? stats[0].count : 0;

  return (
    <div className="space-y-6 animate-fadeIn">
      <ToolHeader 
        title={lt.name}
        description={lt.description}
        icon="fa-chart-bar"
        toolPath="/text/frequency"
        onClear={() => setText('')}
      />
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lt.mode}</label>
            <div className="flex p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm">
              <button 
                onClick={() => setMode('word')}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${mode === 'word' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                {lt.modeWord}
              </button>
              <button 
                onClick={() => setMode('char')}
                className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all ${mode === 'char' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                {lt.modeChar}
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{lt.limit}</label>
            <select 
              value={limit} 
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200 font-bold text-sm"
            >
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
              <option value={100}>Top 100</option>
            </select>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={lt.placeholder}
          className="w-full h-48 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all resize-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-base leading-relaxed font-normal"
        />
      </div>

      {/* 分析结果展示 */}
      {isAnalyzing ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-12 flex flex-col items-center justify-center gap-4 text-indigo-500">
          <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <span className="text-sm font-bold uppercase tracking-widest">{t.loading}</span>
        </div>
      ) : stats.length > 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-fadeIn">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <i className="fas fa-list-ol text-indigo-500"></i>
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{lt.resultLabel}</h3>
            </div>
            <div className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-colors ${
              engine.includes('Standard') 
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' 
                : engine.includes('Enhanced')
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
            }`}>
              <i className={`fas ${engine.includes('Standard') ? 'fa-bolt' : 'fa-microchip'} mr-1.5`}></i>
              Engine: {engine}
            </div>
          </div>
          
          <div className="p-4 md:p-8">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-3 px-2 w-16">{lt.rank}</th>
                    <th className="pb-3 px-2">{lt.item}</th>
                    <th className="pb-3 px-2 w-24">{lt.count}</th>
                    <th className="pb-3 px-2 w-48">{lt.percentage}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                  {stats.map((stat, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-2 text-sm font-bold text-slate-300 dark:text-slate-700">
                        #{idx + 1}
                      </td>
                      <td className="py-4 px-2">
                        <span className="px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:border-indigo-400 dark:group-hover:border-indigo-500 transition-colors shadow-sm">
                          {stat.item}
                        </span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{stat.count}</span>
                      </td>
                      <td className="py-4 px-2">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 dark:from-indigo-400 dark:to-violet-400 rounded-full transition-all duration-700 ease-out"
                              style={{ width: `${(stat.count / maxCount) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 w-10 text-right">{stat.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : text.trim() && !isAnalyzing && (
        <div className="p-12 text-center text-slate-400 italic text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2rem]">
          No significant data extracted. Try different input or mode.
        </div>
      )}
    </div>
  );
};

export default WordFrequency;
