import React, { useState, useReducer, useCallback, useMemo } from 'react';
import QRCode from 'qrcode';
import { useTranslation } from '../../LanguageContext';
import ToolHeader from '../../components/ToolHeader';
import { useQRCode, QRSettings } from '../../hooks/useQRCode';
import { isEmbed as isEmbedMode } from '../../utils/embedEnv';

type SettingsAction<K extends keyof QRSettings = keyof QRSettings> = 
  | { type: 'SET_FIELD'; field: K; value: QRSettings[K] }
  | { type: 'RESET'; payload: QRSettings };

const initialSettings: QRSettings = {
  fgColor: '#4f46e5',
  bgColor: '#ffffff',
  margin: 2,
  scale: 10,
  errorLevel: 'M'
};

function settingsReducer(state: QRSettings, action: SettingsAction): QRSettings {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return action.payload;
    default:
      return state;
  }
}

const QRCodeGen: React.FC = () => {
  const { t } = useTranslation();
  const lt = t.tools.qrCodeGen;

  const [input, setInput] = useState('https://x10.mx');
  const [settings, dispatch] = useReducer(settingsReducer, initialSettings);
  
  const { qrDataUrl, loading, error } = useQRCode(input, settings);

  const isEmbed = isEmbedMode();

  // 派生状态优化
  const canDownload = useMemo(
    () => !!qrDataUrl && !loading && !isEmbed,
    [qrDataUrl, loading, isEmbed]
  );

  const downloadFile = useCallback(async (format: 'png' | 'svg') => {
    if (!qrDataUrl || !input.trim()) return;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const fileName = `qrcode-${timestamp}`;

    if (format === 'png') {
      const link = document.createElement('a');
      link.download = `${fileName}.png`;
      link.href = qrDataUrl;
      link.click();
    } else {
      try {
        const svgString = await QRCode.toString(input, {
          type: 'svg',
          errorCorrectionLevel: settings.errorLevel,
          margin: settings.margin,
          color: {
            dark: settings.fgColor,
            light: settings.bgColor,
          },
        });
        
        if (svgString.startsWith('<svg')) {
          const blob = new Blob([svgString], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `${fileName}.svg`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        console.error('SVG Generation Error:', err);
      }
    }
  }, [qrDataUrl, input, settings]);

  const handleSettingChange = useCallback(
    <K extends keyof QRSettings>(field: K, value: QRSettings[K]) => {
      dispatch({ type: 'SET_FIELD', field, value } as SettingsAction);
    },
    []
  );

  const isLongContent = input.length > 500;

  return (
    <div className="space-y-8 animate-fadeIn">
      <ToolHeader 
        title={lt.name}
        description={lt.description}
        icon="fa-qrcode"
        toolPath="/dev/qrcode"
        onClear={() => setInput('')}
      />

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: Input & Settings */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">{lt.inputLabel}</label>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={lt.inputPlaceholder}
                className={`w-full h-32 p-5 rounded-2xl border ${isLongContent ? 'border-amber-300 dark:border-amber-700' : 'border-slate-200 dark:border-slate-800'} focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all resize-none bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-medium`}
              />
              {isLongContent && (
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold px-1 flex items-center gap-1">
                  <i className="fas fa-exclamation-triangle"></i> {lt.contentWarning}
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-6">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{lt.settings}</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lt.fgColor}</label>
                  <input 
                    type="color" 
                    value={settings.fgColor} 
                    onChange={(e) => handleSettingChange('fgColor', e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lt.bgColor}</label>
                  <input 
                    type="color" 
                    value={settings.bgColor} 
                    onChange={(e) => handleSettingChange('bgColor', e.target.value)}
                    className="w-full h-10 rounded-lg cursor-pointer bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lt.errorLevel}</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['L', 'M', 'Q', 'H'] as const).map((level) => (
                    <button
                      key={level}
                      onClick={() => handleSettingChange('errorLevel', level)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                        settings.errorLevel === level 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20' 
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-400'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <div className="text-[9px] text-slate-400 mt-1 italic">
                  {settings.errorLevel === 'L' && lt.low}
                  {settings.errorLevel === 'M' && lt.medium}
                  {settings.errorLevel === 'Q' && lt.quartile}
                  {settings.errorLevel === 'H' && lt.high}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{lt.margin}</label>
                  <span className="text-xs font-bold text-indigo-600">{settings.margin}</span>
                </div>
                <input 
                  type="range" min="0" max="10" value={settings.margin} 
                  onChange={(e) => handleSettingChange('margin', parseInt(e.target.value))}
                  className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="flex flex-col items-center justify-center space-y-8">
            <div className="relative group">
              <div className="absolute -inset-4 bg-gradient-to-tr from-indigo-500/20 to-violet-500/20 rounded-[2.5rem] blur-2xl group-hover:blur-3xl transition-all duration-500 opacity-60 group-hover:opacity-100"></div>
              <div className="relative bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-center min-w-[280px] min-h-[280px]">
                {loading ? (
                  <div className="flex flex-col items-center gap-4 text-indigo-500">
                    <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                    <span className="text-xs font-bold uppercase tracking-widest">{lt.generating}</span>
                  </div>
                ) : error ? (
                  <div className="text-red-500 flex flex-col items-center gap-3 text-center px-6">
                    <i className="fas fa-exclamation-circle text-5xl opacity-50"></i>
                    <span className="text-sm font-medium">{lt.genError}</span>
                  </div>
                ) : qrDataUrl ? (
                  <img src={qrDataUrl} alt="QR Code" className="w-full h-auto max-w-[240px] rounded-lg shadow-sm" />
                ) : (
                  <div className="text-slate-300 dark:text-slate-600 flex flex-col items-center gap-3">
                    <i className="fas fa-qrcode text-6xl"></i>
                    <span className="text-sm font-medium italic">Waiting for input...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="w-full max-w-sm space-y-3">
              <div className="grid grid-cols-2 gap-4 w-full">
                <button
                  disabled={!canDownload}
                  onClick={() => downloadFile('png')}
                  className="flex items-center justify-center gap-2 py-4 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white rounded-2xl font-bold shadow-xl shadow-indigo-500/20 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <i className="fas fa-image"></i> {lt.downloadPng}
                </button>
                <button
                  disabled={!canDownload}
                  onClick={() => downloadFile('svg')}
                  className="flex items-center justify-center gap-2 py-4 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-2xl font-bold shadow-xl shadow-slate-900/20 dark:shadow-none transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  <i className="fas fa-file-code"></i> {lt.downloadSvg}
                </button>
              </div>
              {isEmbed && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold text-center px-2">
                  嵌入模式下浏览器的安全策略禁止直接下载文件，请在新窗口中打开完整工具后再尝试导出。
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRCodeGen;
