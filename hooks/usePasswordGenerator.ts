
import { useState, useCallback, useMemo, useEffect } from 'react';

export const CHARSETS = {
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  lowercase: 'abcdefghijklmnopqrstuvwxyz',
  numbers: '0123456789',
  symbols: '!@#$%^&*()_+~`|}{[]:;?><,./-=',
  ambiguous: 'Il1O0'
};

export interface PasswordOptions {
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
}

export function usePasswordGenerator(initialLength: number, initialOptions: PasswordOptions) {
  const [length, setLength] = useState(initialLength);
  const [options, setOptions] = useState(initialOptions);
  const [password, setPassword] = useState('');

  // 1. Modulo Bias-Free Secure Random Integer
  const getSecureRandomInt = useCallback((max: number) => {
    const limit = Math.floor(0xffffffff / max) * max;
    let value: number;
    const array = new Uint32Array(1);
    do {
      window.crypto.getRandomValues(array);
      value = array[0];
    } while (value >= limit);
    return value % max;
  }, []);

  const isValid = useMemo(() => 
    options.uppercase || options.lowercase || options.numbers || options.symbols, 
  [options]);

  const generate = useCallback(() => {
    if (!isValid) {
      setPassword('');
      return;
    }

    const sanitize = (set: string) => {
      if (!options.excludeAmbiguous) return set;
      let result = set;
      for (const char of CHARSETS.ambiguous) {
        result = result.split(char).join('');
      }
      return result;
    };

    const pools: string[] = [];
    if (options.uppercase) pools.push(sanitize(CHARSETS.uppercase));
    if (options.lowercase) pools.push(sanitize(CHARSETS.lowercase));
    if (options.numbers) pools.push(sanitize(CHARSETS.numbers));
    if (options.symbols) pools.push(sanitize(CHARSETS.symbols));

    // Flattened charset for filling
    const fullCharset = pools.join('');
    if (fullCharset.length === 0) {
      setPassword('');
      return;
    }

    // Ensure at least one from each pool
    let passwordChars = pools.map(pool => pool.charAt(getSecureRandomInt(pool.length)));

    // Defensive handling: if length is shorter than required unique types, we cap it
    const targetLength = Math.max(length, passwordChars.length);

    // Fill remaining
    for (let i = passwordChars.length; i < targetLength; i++) {
      passwordChars.push(fullCharset.charAt(getSecureRandomInt(fullCharset.length)));
    }

    // Fisher-Yates Shuffle
    for (let i = passwordChars.length - 1; i > 0; i--) {
      const j = getSecureRandomInt(i + 1);
      [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
    }

    setPassword(passwordChars.join(''));
  }, [length, options, isValid, getSecureRandomInt]);

  const entropy = useMemo(() => {
    if (!isValid) return 0;
    const sanitizeSize = (set: string) => {
        if (!options.excludeAmbiguous) return set.length;
        let count = 0;
        for(const char of set) {
            if (!CHARSETS.ambiguous.includes(char)) count++;
        }
        return count;
    };

    let charsetSize = 0;
    if (options.uppercase) charsetSize += sanitizeSize(CHARSETS.uppercase);
    if (options.lowercase) charsetSize += sanitizeSize(CHARSETS.lowercase);
    if (options.numbers) charsetSize += sanitizeSize(CHARSETS.numbers);
    if (options.symbols) charsetSize += sanitizeSize(CHARSETS.symbols);

    if (charsetSize === 0) return 0;
    return Math.round(length * Math.log2(charsetSize));
  }, [length, options, isValid]);

  useEffect(() => {
    generate();
  }, [generate]);

  return {
    password,
    length,
    setLength,
    options,
    setOptions,
    generate,
    entropy,
    isValid
  };
}
