import { useState, useCallback, useRef, useEffect } from 'react';
import { copyToClipboard } from '../utils/clipboard';

/**
 * Hook to handle "Copied!" feedback state.
 * @param duration Duration in ms to show the feedback
 */
export function useCopyFeedback(duration = 1500) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  const trigger = useCallback(async (text: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopied(true);
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => setCopied(false), duration);
    }
    return success;
  }, [duration]);

  const reset = useCallback(() => {
    setCopied(false);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return { copied, trigger, reset };
}