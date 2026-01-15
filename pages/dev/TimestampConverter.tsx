import React, { useState, useEffect, useMemo, useDeferredValue } from 'react';
import { useTranslation } from '../../LanguageContext';
import ToolHeader from '../../components/ToolHeader';
import * as TimeUtils from '../../utils/timeUtils';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';

interface TimestampI18n {
  name: string;
  description: string;
  currentTitle: string;
  toTime: string;
  toDate: string;
  unit: string;
  seconds: string;
  millis: string;
  inputPlaceholder: string;
  datePlaceholder: string;
  localLabel: string;
  utcLabel: string;
  relativeLabel: string;
  invalidDate: string;
  now: string;
  timezone: string;
  currentTimezone: string;
  live: string;
  unixS: string;
  unixMs: string;
  secShort: string;
  msShort: string;
  weekdays: string[];
}

/**
 * Isolated High-Frequency Component
 * Prevents re-rendering the entire page 10 times per second
 */
const LiveClock: React.FC<{ lt: TimestampI18n; lang: string }> = ({ lt, lang }) => {
  const [msNow, setMsNow] = useState(Date.now());

  const localTz = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  useEffect(() => {
    // 100ms is enough for visual fidelity without killing CPU
    const id = setInterval(() => setMsNow(Date.now()), 100);
    return () => clearInterval(id);
  }, []);

  const timeDisplay = useMemo(() => {
    const date = new Date(msNow);
    const formatter = TimeUtils.getDateTimeFormatter('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
    const timeStr = formatter.format(date);
    const ms = (msNow % 1000).toString().padStart(3, '0');
    return { time: timeStr, ms };
  }, [msNow]);

  const dateDisplay = useMemo(() => {
    const date = new Date(msNow);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = lt.weekdays[date.getDay()];
    
    if (lang === 'zh') return `${year}年${month}月${day}日 ${dayOfWeek}`;
    return `${dayOfWeek}, ${month}/${day}/${year}`;
  }, [msNow, lang, lt.weekdays]);

  return (
    <div className="bg-[#0f1421] dark:bg-[#0a0e1a] rounded-[2.5rem] border border-slate-800/50 shadow-2xl p-6 md:p-12 overflow-hidden relative">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10">
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#5046e5] text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              {lt.live}
            </div>
            <h2 className="text-sm font-bold text-slate-100 tracking-wide">{lt.currentTitle}</h2>
          </div>
          
          <div className="space-y-3">
            <div className="text-6xl md:text-8xl font-bold text-white font-mono tracking-tighter tabular-nums flex items-baseline">
              {timeDisplay.time}
              <span className="text-3xl md:text-5xl text-[#5c69ff] ml-1">.{timeDisplay.ms}</span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-slate-500 font-medium text-sm">
              <span className="tracking-widest">{dateDisplay}</span>
              <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
              <span className="px-2 py-0.5 bg-slate-800/50 rounded text-slate-400 text-xs font-bold uppercase tracking-wider">
                {localTz}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-4">
          <CopyCard label={lt.unixS} value={Math.floor(msNow / 1000).toString()} color="#5c69ff" />
          <CopyCard label={lt.unixMs} value={msNow.toString()} color="#8b5cf6" />
        </div>
      </div>
    </div>
  );
};

const CopyCard: React.FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => {
  const { copied, trigger } = useCopyFeedback();
  
  return (
    <div className="bg-[#161c2d] p-5 rounded-3xl border border-slate-800/50 flex flex-col gap-2 min-w-[200px] transition-all hover:border-slate-700">
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em]">{label}</span>
      <div className="flex items-center justify-between gap-4">
        <span className="text-2xl font-bold font-mono truncate" style={{ color }}>{value}</span>
        <button 
          onClick={() => trigger(value)}
          className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all shadow-sm active:scale-90 ${
            copied ? 'bg-green-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-white'
          }`}
        >
          <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} text-sm`}></i>
        </button>
      </div>
    </div>
  );
};

const TsToDatePanel: React.FC<{ lt: TimestampI18n; lang: string }> = ({ lt, lang }) => {
  const [input, setInput] = useState(Math.floor(Date.now() / 1000).toString());
  const deferredInput = useDeferredValue(input);
  const [unit, setUnit] = useState<'s' | 'ms'>('s');
  const [tz, setTz] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const tzOptions = useMemo(() => TimeUtils.getTimezones(lang), [lang]);
  
  const result = useMemo(() => TimeUtils.parseTimestamp(deferredInput, unit), [deferredInput, unit]);
  
  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-6 flex flex-col h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <i className="fas fa-calendar-alt"></i>
          </div>
          {lt.toTime}
        </h3>
        <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl">
          {(['s', 'ms'] as const).map(u => (
            <button 
              key={u}
              onClick={() => setUnit(u)} 
              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold transition-all ${unit === u ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}
            >
              {u === 's' ? lt.secShort : lt.msShort}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lt.inputPlaceholder}
            className={`w-full p-4 pr-32 bg-slate-50 dark:bg-slate-950 border rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200 font-mono font-bold ${result.error ? 'border-red-400' : 'border-slate-200 dark:border-slate-800'}`}
          />
          <button 
            onClick={() => setInput(unit === 's' ? Math.floor(Date.now() / 1000).toString() : Date.now().toString())}
            className="absolute right-2 top-2 bottom-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 transition-all shadow-sm"
          >
            {lt.now}
          </button>
        </div>

        {result.error && (
          <p className="text-xs text-red-500 font-bold px-2 flex items-center gap-1">
            <i className="fas fa-exclamation-triangle"></i> {result.error}
          </p>
        )}

        <div className="space-y-3">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{lt.timezone}</label>
          <select 
            value={tz}
            onChange={(e) => setTz(e.target.value)}
            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200 font-bold text-sm"
          >
            {tzOptions.map(opt => (
              <option key={opt.id} value={opt.id}>{opt.displayLabel}</option>
            ))}
          </select>
        </div>

        {result.date ? (
          <div className="space-y-4 p-5 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 dark:border-indigo-800/30 animate-fadeIn">
            <ResultRow label={lt.localLabel} value={TimeUtils.formatWithTz(result.date, tz, lang)} />
            <ResultRow label={lt.utcLabel} value={result.date.toUTCString()} />
            <div className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 inline-block px-2 py-1 rounded">
              <i className="fas fa-history mr-1"></i> {lt.relativeLabel}: {TimeUtils.getRelativeTime(result.date, lang)}
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-300 italic text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">{lt.invalidDate}</div>
        )}
      </div>
    </div>
  );
};

const DateToTsPanel: React.FC<{ lt: TimestampI18n; lang: string }> = ({ lt, lang }) => {
  const [input, setInput] = useState(new Date().toISOString().replace('T', ' ').substring(0, 19));
  const deferredInput = useDeferredValue(input);
  
  const result = useMemo(() => TimeUtils.parseDateInput(deferredInput), [deferredInput]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-6 flex flex-col h-full">
      <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
          <i className="fas fa-history"></i>
        </div>
        {lt.toDate}
      </h3>

      <div className="space-y-4 flex-1">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lt.datePlaceholder}
            className={`w-full p-4 pr-32 bg-slate-50 dark:bg-slate-950 border rounded-2xl focus:ring-2 focus:ring-violet-500 outline-none text-slate-800 dark:text-slate-200 font-mono font-bold ${result.error ? 'border-red-400' : 'border-slate-200 dark:border-slate-800'}`}
          />
          <button 
            onClick={() => setInput(new Date().toISOString().replace('T', ' ').substring(0, 19))}
            className="absolute right-2 top-2 bottom-2 px-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 transition-all shadow-sm"
          >
            {lt.now}
          </button>
        </div>

        {result.error && (
          <p className="text-xs text-red-500 font-bold px-2 flex items-center gap-1">
            <i className="fas fa-exclamation-triangle"></i> {result.error}
          </p>
        )}

        {result.date ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
            <BigCopyButton label={lt.seconds} value={Math.floor(result.date.getTime() / 1000).toString()} />
            <BigCopyButton label={lt.millis} value={result.date.getTime().toString()} />
          </div>
        ) : (
          <div className="p-12 text-center text-slate-300 italic text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">{lt.invalidDate}</div>
        )}
      </div>
    </div>
  );
};

const ResultRow: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const { copied, trigger } = useCopyFeedback();

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>{label}</span>
        <button onClick={() => trigger(value)} className={`transition-colors ${copied ? 'text-green-500' : 'hover:text-indigo-500'}`}>
          <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
        </button>
      </div>
      <div className="text-lg font-bold text-slate-800 dark:text-slate-200 font-mono break-all">{value}</div>
    </div>
  );
};

const BigCopyButton: React.FC<{ label: string; value: string }> = ({ label, value }) => {
  const { copied, trigger } = useCopyFeedback();

  return (
    <div 
      onClick={() => trigger(value)}
      className={`group cursor-pointer p-5 rounded-2xl border transition-all shadow-sm ${
        copied 
          ? 'bg-green-50 dark:bg-green-900/20 border-green-500' 
          : 'bg-violet-50/30 dark:bg-violet-900/10 border-violet-100 dark:border-violet-800/30 hover:border-violet-400'
      }`}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
        <i className={`fas ${copied ? 'fa-check text-green-500' : 'fa-copy text-slate-300 group-hover:text-violet-500 group-hover:scale-110'} text-[10px] transition-transform`}></i>
      </div>
      <div className={`text-xl font-black font-mono truncate ${copied ? 'text-green-700 dark:text-green-400' : 'text-slate-800 dark:text-slate-200'}`}>
        {value}
      </div>
    </div>
  );
};

const TimestampConverter: React.FC = () => {
  const { t, language } = useTranslation();
  const lt = t.tools.timestampConverter as TimestampI18n;

  return (
    <div className="space-y-6 animate-fadeIn">
      <ToolHeader 
        title={lt.name}
        description={lt.description}
        icon="fa-clock"
        toolPath="/dev/timestamp"
      />
      <LiveClock lt={lt} lang={language} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TsToDatePanel lt={lt} lang={language} />
        <DateToTsPanel lt={lt} lang={language} />
      </div>
    </div>
  );
};

export default TimestampConverter;
