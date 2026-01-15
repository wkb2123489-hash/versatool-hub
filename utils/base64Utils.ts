/**
 * Modern Base64 Utilities using TextEncoder and TextDecoder.
 * Handles Unicode strings correctly and avoids deprecated escape/unescape.
 */

/**
 * Encodes a string to Base64 (UTF-8 safe).
 * Optimized for large inputs by processing in chunks to avoid stack overflow.
 */
export const encodeBase64 = (str: string): string => {
  const bytes = new TextEncoder().encode(str);
  let binary = "";
  const chunkSize = 0x8000; // 32KB chunks
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    // Use apply with subarrays to stay within call stack limits while maintaining performance
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  
  return btoa(binary);
};

/**
 * Decodes a Base64 string to a UTF-8 string.
 */
export const decodeBase64 = (b64: string): string => {
  const normalized = b64.replace(/\s+/g, '');
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

/**
 * Checks if a string is a valid Base64 format.
 * Uses a robust try-atob approach as suggested for product-level reliability.
 */
export const isValidBase64 = (str: string): boolean => {
  const normalized = str.replace(/\s+/g, '');
  if (!normalized || normalized.length % 4 !== 0) return false;

  try {
    // Valid characters check + actual ability to decode
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(normalized)) return false;
    
    atob(normalized);
    return true;
  } catch {
    return false;
  }
};
