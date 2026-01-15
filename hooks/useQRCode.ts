
import { useState, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';

export interface QRSettings {
  fgColor: string;
  bgColor: string;
  margin: number;
  scale: number;
  errorLevel: 'L' | 'M' | 'Q' | 'H';
}

interface UseQRCodeResult {
  qrDataUrl: string;
  loading: boolean;
  error: string | null;
}

/**
 * Custom hook to handle QR code generation with debouncing.
 */
export function useQRCode(input: string, settings: QRSettings): UseQRCodeResult {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQR = useCallback(async (text: string, config: QRSettings) => {
    if (!text.trim()) {
      setQrDataUrl('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const options = {
        errorCorrectionLevel: config.errorLevel,
        margin: config.margin,
        scale: config.scale,
        color: {
          dark: config.fgColor,
          light: config.bgColor,
        },
      };

      const url = await QRCode.toDataURL(text, options);
      setQrDataUrl(url);
    } catch (err: any) {
      console.error('QR Generation Error:', err);
      setError(err.message || 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      generateQR(input, settings);
    }, 350); // Debounce to prevent heavy re-renders during slider/input changes

    return () => clearTimeout(timer);
  }, [input, settings, generateQR]);

  return { qrDataUrl, loading, error };
}
