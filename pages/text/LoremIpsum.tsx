
import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from '../../LanguageContext';
import ToolHeader from '../../components/ToolHeader';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';

const LOREM_WORDS = [
  "lorem", "ipsum", "dolor", "sit", "amet", "consectetur", "adipiscing", "elit", "sed", "do", "eiusmod", "tempor", "incididunt", "ut", "labore", "et", "dolore", "magna", "aliqua", "enim", "ad", "minim", "veniam", "quis", "nostrud", "exercitation", "ullamco", "laboris", "nisi", "ut", "aliquip", "ex", "ea", "commodo", "consequat", "duis", "aute", "irure", "dolor", "in", "reprehenderit", "in", "voluptate", "velit", "esse", "cillum", "dolore", "eu", "fugiat", "nulla", "pariatur", "excepteur", "sint", "occaecat", "cupidatat", "non", "proident", "sunt", "in", "culpa", "qui", "officia", "deserunt", "mollit", "anim", "id", "est", "laborum"
];

const LOREM_TYPES = ['paragraphs', 'sentences', 'words'] as const;
type LoremType = typeof LOREM_TYPES[number];

interface GenerateOptions {
  type: LoremType;
  amount: number;
  startWithLorem: boolean;
  randomFn?: () => number;
}

/**
 * Pure generation logic extracted from the component for testability and reuse.
 */
const generateLorem = ({ type, amount, startWithLorem, randomFn = Math.random }: GenerateOptions): string => {
  const getRandomWord = () => LOREM_WORDS[Math.floor(randomFn() * LOREM_WORDS.length)];

  const generateSentence = (isFirst = false) => {
    const len = Math.floor(randomFn() * 10) + 5;
    let s: string[] = [];
    
    if (isFirst && startWithLorem) {
      s.push("lorem", "ipsum", "dolor", "sit", "amet");
    }

    while (s.length < len) {
      s.push(getRandomWord());
    }

    // Truncate if we accidentally exceeded len due to prefix, but for sentences it's usually fine to have it a bit longer
    let res = s.join(' ');
    return res.charAt(0).toUpperCase() + res.slice(1) + '.';
  };

  const generateParagraph = (isFirst = false) => {
    const len = Math.floor(randomFn() * 3) + 3;
    let p = [];
    for (let i = 0; i < len; i++) {
      p.push(generateSentence(isFirst && i === 0));
    }
    return p.join(' ');
  };

  if (type === 'words') {
    let words: string[] = [];
    if (startWithLorem) {
      words.push("lorem", "ipsum", "dolor", "sit", "amet");
    }
    while (words.length < amount) {
      words.push(getRandomWord());
    }
    return words.slice(0, amount).join(' ');
  }

  if (type === 'sentences') {
    let sentences = [];
    for (let i = 0; i < amount; i++) {
      sentences.push(generateSentence(i === 0));
    }
    return sentences.join(' ');
  }

  // paragraphs
  let paragraphs = [];
  for (let i = 0; i < amount; i++) {
    paragraphs.push(generateParagraph(i === 0));
  }
  return paragraphs.join('\n\n');
};

const MAX_LIMITS: Record<LoremType, number> = {
  paragraphs: 50,
  sentences: 100,
  words: 1000
};

const LoremIpsum: React.FC = () => {
  const { t } = useTranslation();
  const lt = t.tools.loremIpsum;
  const [amount, setAmount] = useState(3);
  const [type, setType] = useState<LoremType>('paragraphs');
  const [startWithLorem, setStartWithLorem] = useState(true);
  const [result, setResult] = useState('');
  const { copied, trigger } = useCopyFeedback();

  const generate = useCallback(() => {
    const limitedAmount = Math.min(amount, MAX_LIMITS[type]);
    const output = generateLorem({ type, amount: limitedAmount, startWithLorem });
    setResult(output);
  }, [amount, type, startWithLorem]);

  useEffect(() => {
    generate();
  }, [generate]);

  const handleCopy = async () => {
    if (!result) return;
    const success = await trigger(result);
    if (!success && t.copyFailed) {
      console.error('Failed to copy placeholder text');
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 1;
    setAmount(Math.min(val, MAX_LIMITS[type]));
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as LoremType;
    setType(newType);
    // Adjust amount if it exceeds the new limit
    if (amount > MAX_LIMITS[newType]) {
      setAmount(MAX_LIMITS[newType]);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <ToolHeader 
        title={lt.name}
        description={lt.description}
        icon="fa-paragraph"
        toolPath="/text/lorem"
      />
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 items-end">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t.tools.mockGen.count} (Max {MAX_LIMITS[type]})</label>
          <input 
            type="number" 
            value={amount} 
            min="1"
            max={MAX_LIMITS[type]}
            onChange={handleAmountChange}
            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200 font-bold"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Type</label>
          <select 
            value={type} 
            onChange={handleTypeChange}
            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 dark:text-slate-200 font-bold"
          >
            <option value="paragraphs">{lt.paragraphs}</option>
            <option value="sentences">{lt.sentences}</option>
            <option value="words">{lt.words}</option>
          </select>
        </div>
        <div className="flex flex-col gap-4">
          <label className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={startWithLorem} 
              onChange={() => setStartWithLorem(!startWithLorem)}
              className="w-5 h-5 text-indigo-600 dark:text-indigo-500 rounded-lg border-slate-300 dark:border-slate-700 focus:ring-indigo-500 bg-white dark:bg-slate-900"
            />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{lt.startWithLorem}</span>
          </label>
          <button 
            onClick={generate}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-100 dark:shadow-none active:scale-[0.98]"
          >
            <i className="fas fa-magic mr-2"></i> {lt.generate}
          </button>
        </div>
      </div>

        <div className="relative group">
          <textarea
            value={result}
            readOnly
            className="w-full h-80 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 outline-none resize-none leading-relaxed shadow-inner"
          />
          <button 
            onClick={handleCopy}
            className={`absolute top-4 right-4 px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 font-bold text-sm ${
              copied 
                ? 'bg-emerald-500 text-white' 
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600'
            }`}
          >
            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
            {copied ? t.copied : t.copy}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoremIpsum;
