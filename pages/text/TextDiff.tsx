
import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../LanguageContext';
import ToolHeader from '../../components/ToolHeader';

type DiffType = 'added' | 'removed' | 'unchanged';

interface DiffPart {
  type: DiffType;
  value: string;
}

interface ProcessedDiff extends DiffPart {
  wordDiff?: { type: DiffType; value: string }[];
}

/**
 * Dual-key Token 结构
 */
interface Token {
  render: string; // 用于渲染的原始文本
  diff: string;   // 用于对比的归一化键值
}

const TextDiff: React.FC = () => {
  const { t } = useTranslation();
  const lt = t.tools.textDiff;
  const [oldText, setOldText] = useState('');
  const [newText, setNewText] = useState('');
  
  const [settings, setSettings] = useState({
    ignoreCase: false,
    ignorePunctuation: false,
    ignoreWhitespace: false
  });

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  /**
   * 核心归一化逻辑 (getDiffKey)
   * 按照：全角转半角 -> 大小写 -> 标点 -> 空白 的顺序进行正交处理
   */
  const getDiffKey = (str: string): string => {
    let key = str;

    // 1. 全角 → 半角 (归一化基础)
    key = key.replace(/[\uff01-\uff5e]/g, (ch) => 
      String.fromCharCode(ch.charCodeAt(0) - 0xfee0)
    );
    key = key.replace(/\u3000/g, " ");

    // 2. 忽略大小写
    if (settings.ignoreCase) {
      key = key.toLowerCase();
    }

    // 3. 忽略标点
    if (settings.ignorePunctuation) {
      key = key.replace(/[\p{P}\p{S}]/gu, "");
    }

    // 4. 忽略空白
    if (settings.ignoreWhitespace) {
      key = key.replace(/\s+/g, "");
    }

    // 方案 A：忽略空白模式下完全依赖替换结果，精确模式下执行 trim() 防止首尾干扰
    return settings.ignoreWhitespace ? key : key.trim();
  };

  /**
   * 增强型分词器 (Tokenizer)
   * 遵循“render 决定类型，diff 决定对比”的架构分工
   */
  const tokenize = (text: string): Token[] => {
    if (!text) return [];
    
    // 正则匹配：CJK 字符、西文字词（含撇号）、空白块、或单个标点
    const rawTokens = text.match(/([\u4e00-\u9fa5]|[\w']+|[^\s\w\u4e00-\u9fa5]|\s+)/gu) || [];
    
    return rawTokens.map(raw => ({
      render: raw,
      diff: getDiffKey(raw)
    })).filter(t => {
      // 基于 render 判定 Token 类型，确保过滤逻辑准确
      // 忽略标点：过滤“纯标点 Token”
      if (settings.ignorePunctuation && /^[\p{P}\p{S}]+$/u.test(t.render)) {
        return false;
      }
      // 忽略空白：过滤“纯空白 Token”
      if (settings.ignoreWhitespace && /^\s+$/.test(t.render)) {
        return false;
      }
      return true;
    });
  };

  /**
   * 基于 LCS（动态规划）的差异算法
   */
  const computeDiff = <T extends { diff: string }>(
    oldItems: T[], 
    newItems: T[]
  ): { type: DiffType; oldItem?: T; newItem?: T }[] => {
    const n = oldItems.length;
    const m = newItems.length;
    
    const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (oldItems[i - 1].diff === newItems[j - 1].diff) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    const result: { type: DiffType; oldItem?: T; newItem?: T }[] = [];
    let i = n, j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && oldItems[i - 1].diff === newItems[j - 1].diff) {
        result.unshift({ type: 'unchanged', oldItem: oldItems[i - 1], newItem: newItems[j - 1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        result.unshift({ type: 'added', newItem: newItems[j - 1] });
        j--;
      } else {
        result.unshift({ type: 'removed', oldItem: oldItems[i - 1] });
        i--;
      }
    }
    return result;
  };

  /**
   * 对比主流程
   */
  const diffResult = useMemo(() => {
    if (!oldText && !newText) return [];

    const oldLinesRaw = oldText.split(/\r?\n/);
    const newLinesRaw = newText.split(/\r?\n/);

    // 行级 diffKey：ignoreWhitespace = true 时，行级对比将具备“强忽略”特性
    const oldLines: Token[] = oldLinesRaw.map(l => ({ render: l, diff: getDiffKey(l) }));
    const newLines: Token[] = newLinesRaw.map(l => ({ render: l, diff: getDiffKey(l) }));

    const lineDiffs = computeDiff(oldLines, newLines);
    const processed: ProcessedDiff[] = [];

    let k = 0;
    while (k < lineDiffs.length) {
      const current = lineDiffs[k];

      if (current.type === 'unchanged') {
        processed.push({ type: 'unchanged', value: current.newItem!.render });
        k++;
        continue;
      }

      const removals: Token[] = [];
      while (k < lineDiffs.length && lineDiffs[k].type === 'removed') {
        removals.push(lineDiffs[k].oldItem!);
        k++;
      }
      const additions: Token[] = [];
      while (k < lineDiffs.length && lineDiffs[k].type === 'added') {
        additions.push(lineDiffs[k].newItem!);
        k++;
      }

      const maxInBlock = Math.max(removals.length, additions.length);
      for (let p = 0; p < maxInBlock; p++) {
        const rem = removals[p];
        const add = additions[p];

        if (rem && add) {
          const oldTokens = tokenize(rem.render);
          const newTokens = tokenize(add.render);
          const wordDiffs = computeDiff(oldTokens, newTokens);

          processed.push({
            type: 'removed',
            value: rem.render,
            wordDiff: wordDiffs
              .filter(d => d.type !== 'added')
              .map(d => ({ type: d.type, value: d.oldItem!.render }))
          });
          processed.push({
            type: 'added',
            value: add.render,
            wordDiff: wordDiffs
              .filter(d => d.type !== 'removed')
              .map(d => ({ type: d.type, value: d.newItem!.render }))
          });
        } else if (rem) {
          processed.push({ type: 'removed', value: rem.render });
        } else if (add) {
          processed.push({ type: 'added', value: add.render });
        }
      }
    }

    return processed;
  }, [oldText, newText, settings]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <ToolHeader 
        title={lt.name}
        description={lt.description}
        icon="fa-file-medical"
        toolPath="/text/diff"
      />
      <div className="bg-white dark:bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 flex flex-wrap items-center gap-6 sticky top-0 z-10">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <i className="fas fa-sliders-h text-indigo-500"></i> {lt.settings}
        </span>
        <div className="flex flex-wrap gap-6">
          {[
            { id: 'ignoreCase', label: lt.ignoreCase },
            { id: 'ignorePunctuation', label: lt.ignorePunctuation },
            { id: 'ignoreWhitespace', label: lt.ignoreWhitespace }
          ].map(setting => (
            <label key={setting.id} className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox" 
                checked={settings[setting.id as keyof typeof settings]} 
                onChange={() => toggleSetting(setting.id as keyof typeof settings)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 bg-white dark:bg-slate-800"
              />
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400 group-hover:text-indigo-500 transition-colors">
                {setting.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{lt.original}</label>
              <button onClick={() => setOldText('')} className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors">
                <i className="fas fa-trash-alt mr-1"></i> {t.clear}
              </button>
            </div>
            <textarea
              value={oldText}
              onChange={(e) => setOldText(e.target.value)}
              placeholder={lt.placeholderOld}
              className="w-full h-56 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-mono leading-relaxed resize-none shadow-inner"
            />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{lt.modified}</label>
              <button onClick={() => setNewText('')} className="text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors">
                <i className="fas fa-trash-alt mr-1"></i> {t.clear}
              </button>
            </div>
            <textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder={lt.placeholderNew}
              className="w-full h-56 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm font-mono leading-relaxed resize-none shadow-inner"
            />
          </div>
        </div>
      </div>

      {/* Result Output */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <i className="fas fa-search-plus text-sm"></i>
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
              {lt.diff}
            </h3>
          </div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline-block">
            {lt.inlineLegend}
          </span>
        </div>
        
        <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-sm leading-6">
          {(!oldText && !newText) ? (
            <div className="p-20 text-center text-slate-400">
              <i className="fas fa-code-compare text-4xl mb-4 opacity-20 block"></i>
              <p className="text-sm italic font-medium">输入文本后将自动显示差异...</p>
            </div>
          ) : diffResult.length === 0 ? (
            <div className="p-16 text-center text-emerald-500/60 font-medium italic bg-emerald-500/5">
              <i className="fas fa-check-circle mb-2 block text-2xl"></i>
              {lt.noDiff}
            </div>
          ) : (
            diffResult.map((line, idx) => {
              const isAdded = line.type === 'added';
              const isRemoved = line.type === 'removed';
              
              return (
                <div 
                  key={idx} 
                  className={`flex items-start group hover:brightness-105 transition-all duration-150 ${
                    isAdded ? 'bg-emerald-500/10 dark:bg-emerald-500/10' : 
                    isRemoved ? 'bg-rose-500/10 dark:bg-rose-500/10' : ''
                  }`}
                >
                  <div className={`w-10 flex-shrink-0 text-center select-none text-[12px] font-bold pt-1 ${
                    isAdded ? 'text-emerald-500' : 
                    isRemoved ? 'text-rose-500' : 'text-slate-300 dark:text-slate-700'
                  }`}>
                    {isAdded ? '+' : isRemoved ? '-' : ' '}
                  </div>

                  <div className={`flex-1 px-4 py-1.5 whitespace-pre-wrap break-all ${
                    isAdded ? 'text-emerald-900 dark:text-emerald-400' : 
                    isRemoved ? 'text-rose-900 dark:text-rose-400' : 'text-slate-500 dark:text-slate-500 opacity-80'
                  }`}>
                    {line.wordDiff ? (
                      line.wordDiff.map((part, pidx) => (
                        <span key={pidx} className={
                          part.type === 'added' ? 'bg-emerald-500/25 dark:bg-emerald-400/20 text-emerald-700 dark:text-emerald-300 font-bold rounded-sm px-0.5' :
                          part.type === 'removed' ? 'bg-rose-500/25 dark:bg-rose-400/20 text-rose-700 dark:text-rose-300 rounded-sm px-0.5' : ''
                        }>
                          {part.value}
                        </span>
                      ))
                    ) : (
                      line.value || ' '
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default TextDiff;
