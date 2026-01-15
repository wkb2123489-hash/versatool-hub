
/**
 * Time Utilities for High-Performance Timestamp Conversion
 */

// Cache for Intl formatters to avoid expensive reconstruction
const formatterCache = new Map<string, Intl.DateTimeFormat>();
const relativeFormatterCache = new Map<string, Intl.RelativeTimeFormat>();

/**
 * Gets or creates a memoized Intl.DateTimeFormat
 */
export function getDateTimeFormatter(lang: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${lang}-${JSON.stringify(options)}`;
  if (!formatterCache.has(key)) {
    formatterCache.set(key, new Intl.DateTimeFormat(lang, options));
  }
  return formatterCache.get(key)!;
}

/**
 * Gets or creates a memoized Intl.RelativeTimeFormat
 */
export function getRelativeTimeFormatter(lang: string): Intl.RelativeTimeFormat {
  if (!relativeFormatterCache.has(lang)) {
    relativeFormatterCache.set(lang, new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }));
  }
  return relativeFormatterCache.get(lang)!;
}

/**
 * Validates if a timestamp (ms) is within JavaScript's safe Date range
 */
export const isSafeDate = (ms: number): boolean => {
  return !isNaN(ms) && ms <= 8.64e15 && ms >= -8.64e15;
};

/**
 * Strict timestamp parser
 */
export function parseTimestamp(input: string, unit: 's' | 'ms'): { date: Date | null; error: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { date: null, error: null };
  
  const val = Number(trimmed);
  if (isNaN(val)) return { date: null, error: 'Invalid Number' };

  const ms = unit === 's' ? val * 1000 : val;
  
  if (!isSafeDate(ms)) {
    return { date: null, error: 'Out of range (±8.64e15 ms)' };
  }

  return { date: new Date(ms), error: null };
}

/**
 * Strict date string parser
 */
export function parseDateInput(input: string): { date: Date | null; error: string | null } {
  const trimmed = input.trim();
  if (!trimmed) return { date: null, error: null };

  // Try parsing ISO format or common variations
  // Replace space with T for ISO compliance if basic YYYY-MM-DD HH:mm:ss is provided
  const normalized = trimmed.includes(' ') && !trimmed.includes('T') 
    ? trimmed.replace(' ', 'T') 
    : trimmed;
    
  const date = new Date(normalized);
  if (isNaN(date.getTime())) return { date: null, error: 'Invalid Date Format' };
  
  return { date, error: null };
}

/**
 * Formats a date with a specific timezone using cached formatters
 */
export function formatWithTz(date: Date, tz: string, lang: string): string {
  const formatter = getDateTimeFormatter(lang === 'zh' ? 'zh-CN' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: tz
  });
  return formatter.format(date);
}

/**
 * Relative time calculation using Intl.RelativeTimeFormat
 */
export function getRelativeTime(date: Date, lang: string): string {
  const diff = (date.getTime() - Date.now()) / 1000;
  const absDiff = Math.abs(diff);
  const rtf = getRelativeTimeFormatter(lang === 'zh' ? 'zh-CN' : 'en-US');

  if (absDiff < 60) return rtf.format(Math.round(diff), 'second');
  if (absDiff < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (absDiff < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  if (absDiff < 2592000) return rtf.format(Math.round(diff / 86400), 'day');
  if (absDiff < 31536000) return rtf.format(Math.round(diff / 2592000), 'month');
  return rtf.format(Math.round(diff / 31536000), 'year');
}

/**
 * Efficiently generates stable timezone data
 * Uses a fixed reference date to ensure stable DST offsets during sorting
 */
const REFERENCE_DATE = new Date('2024-01-01T00:00:00Z');

export interface TimezoneOption {
  id: string;
  offsetPart: string;
  localizedName: string;
  offsetMinutes: number;
  displayLabel: string;
}

export function getTimezones(lang: string): TimezoneOption[] {
  const ids = (Intl as any).supportedValuesOf 
    ? (Intl as any).supportedValuesOf('timeZone') 
    : [Intl.DateTimeFormat().resolvedOptions().timeZone, 'UTC'];
  
  const langTag = lang === 'zh' ? 'zh-CN' : 'en-US';

  const options = ids.map((id: string) => {
    const offsetFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: id,
      timeZoneName: 'shortOffset'
    });
    const offsetPart = offsetFormatter.formatToParts(REFERENCE_DATE).find(p => p.type === 'timeZoneName')?.value || '';
    
    const nameFormatter = new Intl.DateTimeFormat(langTag, {
      timeZone: id,
      timeZoneName: 'long'
    });
    const localizedName = nameFormatter.formatToParts(REFERENCE_DATE).find(p => p.type === 'timeZoneName')?.value || '';

    let offsetMinutes = 0;
    const match = offsetPart.match(/GMT([+-])(\d+)(?::(\d+))?/);
    if (match) {
      const sign = match[1] === '+' ? 1 : -1;
      const hours = parseInt(match[2], 10);
      const mins = match[3] ? parseInt(match[3], 10) : 0;
      offsetMinutes = sign * (hours * 60 + mins);
    }

    return {
      id,
      offsetPart,
      localizedName,
      offsetMinutes,
      displayLabel: `${id} (${offsetPart}) ${localizedName !== id ? `- ${localizedName}` : ''}`
    };
  });

  return options.sort((a, b) => a.offsetMinutes - b.offsetMinutes);
}
