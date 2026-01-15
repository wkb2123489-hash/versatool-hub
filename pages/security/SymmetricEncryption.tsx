import React, { useState, useMemo } from 'react';
import { useTranslation } from '../../LanguageContext';
import ToolHeader from '../../components/ToolHeader';
import { useCopyFeedback } from '../../hooks/useCopyFeedback';
import * as CryptoUtils from '../../utils/cryptoUtils';

const SymmetricEncryption: React.FC = () => {
  const { t } = useTranslation();
  const lt = t.tools.symmetricCrypto;
  const { copied, trigger } = useCopyFeedback();

  const [input, setInput] = useState('');
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [algo, setAlgo] = useState<CryptoUtils.CryptoAlgo>('AES');
  const [error, setError] = useState('');

  const keyStrength = useMemo(() => CryptoUtils.checkKeyStrength(key), [key]);

  const handleProcess = () => {
    if (!input.trim() || !key.trim()) return;
    setError('');

    try {
      if (mode === 'encrypt') {
        const result = CryptoUtils.encryptText(input, key, algo);
        setOutput(result);
      } else {
        const result = CryptoUtils.decryptText(input, key);
        setOutput(result);
      }
    } catch (e: any) {
      setOutput('');
      if (e instanceof CryptoUtils.CryptoError) {
        switch (e.code) {
          case CryptoUtils.CryptoErrorCode.UNSUPPORTED_VERSION:
            setError(t.tools.symmetricCrypto.unsupportedVersion || 'Unsupported data version.');
            break;
          case CryptoUtils.CryptoErrorCode.INTEGRITY_FAILED:
            setError(t.tools.symmetricCrypto.integrityFailed || 'Integrity check failed. Incorrect key or tampered data.');
            break;
          case CryptoUtils.CryptoErrorCode.INVALID_PAYLOAD:
            setError(lt.formatError);
            break;
          default:
            setError(lt.decryptError);
        }
      } else {
        setError(lt.decryptError);
      }
    }
  };

  const handleGenerateKey = () => {
    setKey(CryptoUtils.generateRandomKey());
    setShowKey(true);
  };

  const strengthColors = {
    weak: 'bg-rose-500',
    medium: 'bg-amber-500',
    strong: 'bg-emerald-500'
  };

  const isLegacyAlgo = algo !== 'AES';

  return (
    <div className="space-y-6 animate-fadeIn">
      <ToolHeader 
        title={lt.name}
        description={lt.description}
        icon="fa-lock"
        toolPath="/security/symmetric"
        onClear={() => { setInput(''); setOutput(''); setError(''); }}
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Controls & Input */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-wrap gap-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 items-center">
              <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <button 
                  onClick={() => setMode('encrypt')}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${mode === 'encrypt' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}
                >
                  <i className="fas fa-shield-halved mr-2"></i> {lt.encrypt}
                </button>
                <button 
                  onClick={() => setMode('decrypt')}
                  className={`px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${mode === 'decrypt' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}
                >
                  <i className="fas fa-lock-open mr-2"></i> {lt.decrypt}
                </button>
              </div>

              <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden md:block"></div>

              <div className="flex-1 min-w-[150px]">
                <select 
                  value={algo}
                  disabled={mode === 'decrypt'}
                  onChange={(e) => setAlgo(e.target.value as any)}
                  className="w-full p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <option value="AES">AES-256 (Production Standard)</option>
                  <option value="TripleDES">TripleDES (Legacy Compatibility)</option>
                  <option value="DES">DES (Insecure / Legacy Only)</option>
                </select>
              </div>
            </div>

            {isLegacyAlgo && mode === 'encrypt' && (
              <div className="p-3 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-xl text-[10px] text-rose-600 font-bold flex items-center gap-2">
                <i className="fas fa-warning"></i> {lt.insecureWarning}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                {mode === 'encrypt' ? lt.inputLabel : lt.outputLabel}
              </label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-56 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all resize-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono text-sm shadow-inner leading-relaxed"
                placeholder={mode === 'encrypt' ? lt.placeholder : 'Paste encrypted JSON payload here...'}
              />
            </div>
          </div>

          {/* Key & Security Panel */}
          <div className="space-y-6">
            <div className="p-6 bg-indigo-50/30 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100 dark:border-indigo-800/30 space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <i className="fas fa-key text-indigo-500"></i> {lt.keyLabel}
                  </label>
                  <button 
                    onClick={handleGenerateKey}
                    className="text-[10px] font-bold text-indigo-600 hover:underline"
                  >
                    {lt.generateKey}
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    className="w-full p-3.5 pr-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={lt.keyPlaceholder}
                  />
                  <button 
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                  >
                    <i className={`fas ${showKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>

                {key && (
                  <div className="space-y-2 animate-fadeIn">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-slate-400">{lt.keyStrength}</span>
                      <span className={keyStrength === 'strong' ? 'text-emerald-500' : keyStrength === 'medium' ? 'text-amber-500' : 'text-rose-500'}>
                        {lt[keyStrength]}
                      </span>
                    </div>
                    <div className="h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full ${strengthColors[keyStrength]} transition-all duration-500`} style={{ width: keyStrength === 'strong' ? '100%' : keyStrength === 'medium' ? '60%' : '30%' }}></div>
                    </div>
                  </div>
                )}
              </div>

              <button 
                onClick={handleProcess}
                disabled={!input || !key}
                className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-3 ${
                  mode === 'encrypt' 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20' 
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/20'
                } disabled:opacity-50 disabled:shadow-none`}
              >
                <i className={`fas ${mode === 'encrypt' ? 'fa-shield-halved' : 'fa-lock-open'}`}></i>
                {lt.processBtn}
              </button>
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800/50 space-y-4">
               <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                 <i className="fas fa-microchip"></i> {lt.advanced}
               </h4>
               <div className="space-y-3">
                 <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                   {lt.kdf}
                 </div>
                 <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                   {lt.iv}
                 </div>
                 <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                   <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                   Authenticated (HMAC-SHA256)
                 </div>
               </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl text-sm flex items-center gap-3 animate-pulse">
            <i className="fas fa-exclamation-triangle text-lg"></i> {error}
          </div>
        )}

        {output && (
          <div className="space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {mode === 'encrypt' ? lt.outputLabel : lt.inputLabel}
              </label>
              {mode === 'encrypt' && (
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
                  Structured Payload (v1)
                </span>
              )}
            </div>
            <div className="relative group">
              <textarea
                value={output}
                readOnly
                className="w-full h-48 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-900 dark:bg-slate-950 text-indigo-300 dark:text-indigo-400 font-mono text-sm outline-none resize-none shadow-xl leading-relaxed"
              />
              <button 
                onClick={() => trigger(output)}
                className={`absolute top-4 right-4 px-4 py-2 rounded-xl transition-all shadow-lg flex items-center gap-2 font-bold text-xs ${
                  copied 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-white/10 hover:bg-white/20 border border-white/10 text-white'
                }`}
              >
                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                {copied ? t.copied : t.copy}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="text-[10px] text-slate-400 dark:text-slate-600 text-center italic max-w-2xl mx-auto">
        This tool uses the <strong>CryptoJS</strong> library with production-grade configuration. Encryption keys are derived via <strong>PBKDF2</strong> (SHA-256) with 100,000 iterations. Integrity is verified using <strong>HMAC-SHA256</strong> (Encrypt-then-MAC). No data ever leaves your browser.
      </div>
    </div>
  );
};

export default SymmetricEncryption;
