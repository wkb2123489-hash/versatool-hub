
import React, { useMemo } from 'react';
import { useTranslation } from '../../LanguageContext';
import ToolHeader from '../../components/ToolHeader';
import { usePasswordGenerator, PasswordOptions } from '../../hooks/usePasswordGenerator';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';

const PasswordGen: React.FC = () => {
  const { t } = useTranslation();
  const lt = t.tools.passwordGen;
  const { copied, trigger } = useCopyFeedback(1500);

  const {
    password,
    length,
    setLength,
    options,
    setOptions,
    generate,
    entropy,
    isValid
  } = usePasswordGenerator(16, {
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false
  });

  const strengthInfo = useMemo(() => {
    if (!isValid) return { label: '-', color: 'bg-slate-300' };
    
    // Using entropy bits for professional strength assessment
    // < 40: Weak, 40-70: Medium, > 70: Strong
    if (entropy < 40) {
      return { label: lt.weak, color: 'bg-rose-500' };
    }
    if (entropy < 75) {
      return { label: lt.medium, color: 'bg-amber-500' };
    }
    return { label: lt.strong, color: 'bg-emerald-500' };
  }, [entropy, isValid, lt]);

  const handleToggleOption = (key: keyof PasswordOptions) => {
    const isMainOption = ['uppercase', 'lowercase', 'numbers', 'symbols'].includes(key);
    if (isMainOption) {
      // UX Guard: Prevent deselecting everything
      const otherMainActive = Object.keys(options)
        .filter(k => k !== key && ['uppercase', 'lowercase', 'numbers', 'symbols'].includes(k))
        .some(k => options[k as keyof PasswordOptions]);
      
      if (!otherMainActive && options[key]) return;
    }
    
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <ToolHeader 
        title={lt.name}
        description={lt.description}
        icon="fa-key"
        toolPath="/security/password"
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <i className="fas fa-lock text-indigo-500"></i>
              MODULO BIAS FREE
            </div>
          </div>
        </div>

        <div className="relative group">
        <div className="w-full p-6 bg-slate-900 dark:bg-slate-950 text-indigo-300 dark:text-indigo-400 border border-slate-800 rounded-2xl font-mono text-xl md:text-2xl break-all min-h-[6rem] flex items-center pr-16 shadow-inner transition-colors">
          {password || <span className="text-slate-600 text-sm italic">Select at least one option</span>}
        </div>
        <button 
          onClick={() => trigger(password)}
          disabled={!password}
          className={`absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl transition-all flex items-center justify-center border shadow-sm ${
            copied 
              ? 'bg-emerald-500 border-emerald-400 text-white' 
              : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
          } disabled:opacity-0 active:scale-90`}
          title={t.copy}
        >
          <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} text-lg`}></i>
          </button>
          {copied && (
            <div className="absolute -top-10 right-0 bg-emerald-500 text-white text-[10px] px-2 py-1 rounded shadow-lg animate-bounce font-bold">
              {t.copied}
            </div>
          )}
        </div>

        <div className="space-y-8 bg-slate-50 dark:bg-slate-950/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/50">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-600 dark:text-slate-400">{lt.length}</span>
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lt.entropy}: <span className="text-indigo-600 dark:text-indigo-400">{entropy} bits</span></span>
                <span className="bg-indigo-600 text-white px-3 py-1 rounded-lg font-bold text-sm shadow-md">{length}</span>
            </div>
          </div>
          <input 
            type="range" min="4" max="128" value={length} 
            onChange={(e) => setLength(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-500"
          />
          <div className="flex items-center gap-4">
            <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={`h-full ${strengthInfo.color} transition-all duration-500 ease-out`} 
                style={{ width: `${isValid ? Math.min((entropy / 128) * 100, 100) : 0}%` }}
              ></div>
            </div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {lt.strength}: <span className={isValid ? 'text-slate-700 dark:text-slate-300' : 'text-slate-500'}>{strengthInfo.label}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['uppercase', 'lowercase', 'numbers', 'symbols'] as Array<keyof PasswordOptions>).map((key) => {
             const isActive = options[key];
             const isLastOne = Object.keys(options).filter(k => ['uppercase', 'lowercase', 'numbers', 'symbols'].includes(k) && options[k as keyof PasswordOptions]).length === 1 && isActive;

             return (
              <label 
                key={key} 
                className={`group flex flex-col items-center gap-2 p-3 bg-white dark:bg-slate-900 border rounded-2xl transition-all shadow-sm ${
                  isActive ? 'border-indigo-500 ring-1 ring-indigo-500/10' : 'border-slate-100 dark:border-slate-800 opacity-60'
                } ${isLastOne ? 'cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <input 
                  type="checkbox" 
                  checked={isActive} 
                  disabled={isLastOne}
                  onChange={() => handleToggleOption(key)}
                  className="hidden"
                />
                <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isActive ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 dark:border-slate-700'}`}>
                  {isActive && <i className="fas fa-check text-[10px] text-white"></i>}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {lt[key] || key}
                </span>
              </label>
            );
          })}
        </div>

        <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
             <label className="flex items-center gap-3 cursor-pointer group w-fit">
                <input 
                    type="checkbox" 
                    checked={options.excludeAmbiguous}
                    onChange={() => handleToggleOption('excludeAmbiguous')}
                    className="w-5 h-5 text-indigo-600 border-slate-300 dark:border-slate-700 rounded focus:ring-indigo-500 bg-white dark:bg-slate-900"
                />
                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 transition-colors">
                    {lt.excludeAmbiguous}
                </span>
             </label>
        </div>

        <button 
          onClick={generate}
          disabled={!isValid}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-2xl text-lg font-bold shadow-xl shadow-indigo-500/20 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <i className="fas fa-sync-alt"></i> {lt.generate}
        </button>
      </div>
      </div>

      <div className="text-[10px] text-slate-400 dark:text-slate-500 italic text-center space-y-1">
        <div className="flex items-center justify-center gap-4">
          <span className="flex items-center gap-1"><i className="fas fa-shield-halved text-emerald-500"></i> Crypto API Secure</span>
          <span className="flex items-center gap-1"><i className="fas fa-server text-rose-500"></i> Local Only</span>
          <span className="flex items-center gap-1"><i className="fas fa-random text-indigo-500"></i> No Bias</span>
        </div>
        <p>Passwords are never sent to any server. Generation happens entirely in your browser.</p>
      </div>
    </div>
  );
};

export default PasswordGen;
