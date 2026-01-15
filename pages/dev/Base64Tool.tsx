import React, { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';
import { useTranslation } from '../../LanguageContext';
import ToolHeader from '../../components/ToolHeader';
import { encodeBase64, decodeBase64, isValidBase64 } from '../../utils/base64Utils';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';

const Base64Tool: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const { t } = useTranslation();
  const lt = t.tools.base64;
  const { copied, trigger } = useCopyFeedback();
  const outputRef = useRef<HTMLDivElement>(null);

  // Requirement 1: Use useLayoutEffect for smooth, stable scrolling instead of setTimeout
  useLayoutEffect(() => {
    if (output && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [output]);

  // Requirement 5: Auto-clear error messages after 4 seconds to reduce user stress
  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(''), 4000);
    return () => clearTimeout(timer);
  }, [error]);

  const handleEncode = useCallback(() => {
    if (!input.trim()) return;
    try {
      const encoded = encodeBase64(input);
      setOutput(encoded);
      setError('');
    } catch (e) {
      console.error('Base64 Encoding Error:', e);
      setError(lt.encodeError);
    }
  }, [input, lt.encodeError]);

  const handleDecode = useCallback(() => {
    if (!input.trim()) return;
    
    // Validation
    if (!isValidBase64(input)) {
      setError(lt.invalidBase64);
      return;
    }

    try {
      const decoded = decodeBase64(input);
      setOutput(decoded);
      setError('');
    } catch (e) {
      console.error('Base64 Decoding Error:', e);
      if (e instanceof TypeError) {
        setError(lt.invalidUtf8);
      } else {
        setError(lt.decodeError);
      }
    }
  }, [input, lt]);

  const handleCopy = async () => {
    if (!output) return;
    const success = await trigger(output);
    if (!success) setError(t.copyFailed);
  };

  const swap = useCallback(() => {
    const currentInput = input;
    const currentOutput = output;
    setInput(currentOutput);
    setOutput(currentInput);
    setError('');
  }, [input, output]);

  const clear = useCallback(() => {
    setInput('');
    setOutput('');
    setError('');
  }, []);

  // Requirement 2: Smart button state linkage
  const isInputEmpty = !input.trim();
  const isInvalidForDecode = isInputEmpty || !isValidBase64(input);

  return (
    <div className="space-y-6 animate-fadeIn">
      <ToolHeader 
        title={lt.name}
        description={lt.description}
        icon="fa-shield-halved"
        toolPath="/dev/base64"
        onClear={clear}
      />
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{lt.inputLabel}</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full h-40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all resize-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono text-sm shadow-inner"
            placeholder={lt.placeholder}
          />
        </div>

        <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start">
          <button 
            onClick={handleEncode}
            disabled={isInputEmpty}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
          >
            <i className="fas fa-lock mr-2"></i> {lt.encodeBtn}
          </button>
          <button 
            onClick={handleDecode}
            disabled={isInvalidForDecode}
            title={isInvalidForDecode && !isInputEmpty ? lt.invalidBase64 : ''}
            className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <i className="fas fa-unlock-alt mr-2"></i> {lt.decodeBtn}
          </button>
          <button 
            onClick={swap}
            disabled={isInputEmpty && !output.trim()}
            className="w-11 h-11 flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all border border-slate-200 dark:border-slate-700 disabled:opacity-50"
            title="Swap"
          >
            <i className="fas fa-right-left"></i>
          </button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/20 text-red-600 dark:text-red-400 rounded-xl text-sm flex items-center gap-3 animate-pulse">
            <i className="fas fa-exclamation-circle text-lg"></i> {error}
          </div>
        )}

          <div className="space-y-2" ref={outputRef}>
            <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{lt.outputLabel}</label>
            <div className="relative group">
              <textarea
                value={output}
                readOnly
                className="w-full h-40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 text-slate-600 dark:text-slate-400 font-mono text-sm outline-none resize-none shadow-inner"
              />
              {output && (
                <button 
                  onClick={handleCopy}
                  className={`absolute top-4 right-4 p-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 font-bold text-xs ${
                    copied 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600'
                  }`}
                >
                  <i className={`fas ${copied ? 'fa-check' : 'fa-copy'} text-lg`}></i>
                  {copied && <span>{t.copied}</span>}
                </button>
              )}
            </div>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 italic mt-2 px-1">
            <i className="fas fa-info-circle mr-1"></i>
            Encodes using UTF-8 standards. Suitable for most text content.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Base64Tool;
