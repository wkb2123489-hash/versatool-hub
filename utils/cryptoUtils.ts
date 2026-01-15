import * as CryptoJS from 'crypto-js';

export type CryptoAlgo = 'AES' | 'DES' | 'TripleDES';

/**
 * Security Constants - Locked Down
 */
const SECURITY_CONFIG = Object.freeze({
  VERSION: 1,
  PBKDF2_ITERATIONS: 100000,
  KEY_SIZE_BYTES: 256 / 8, // 32 bytes for AES-256
  SALT_SIZE_BYTES: 16,
  IV_SIZE_BYTES: 16,
});

/**
 * Standard Error Codes for Trust Boundary
 */
export enum CryptoErrorCode {
  INVALID_PAYLOAD = 'INVALID_PAYLOAD',
  UNSUPPORTED_VERSION = 'UNSUPPORTED_VERSION',
  INTEGRITY_FAILED = 'INTEGRITY_FAILED',
  DECRYPTION_FAILED = 'DECRYPTION_FAILED',
  MALFORMED_INPUT = 'MALFORMED_INPUT'
}

export class CryptoError extends Error {
  constructor(public code: CryptoErrorCode, message?: string) {
    super(message || code);
    this.name = 'CryptoError';
  }
}

/**
 * Payload structure for encrypted data (v1)
 */
export interface EncryptedPayload {
  v: number;      // Version
  a: CryptoAlgo;  // Algorithm
  s: string;      // Salt (hex)
  iv: string;     // IV (hex)
  ct: string;     // Ciphertext (base64)
  mac: string;    // HMAC (hex) for integrity (Encrypt-then-MAC)
}

const ALGO_MAP = {
  AES: CryptoJS.AES,
  DES: CryptoJS.DES,
  TripleDES: CryptoJS.TripleDES,
};

/**
 * Derives a cryptographic key and a separate MAC key using PBKDF2.
 * We derive a longer buffer and split it to ensure key separation.
 */
function deriveKeys(passphrase: string, salt: CryptoJS.lib.WordArray) {
  // We need 32 bytes for AES key + 32 bytes for HMAC key = 64 bytes total
  const derived = CryptoJS.PBKDF2(passphrase, salt, {
    keySize: (32 + 32) / 4, // in 32-bit words
    iterations: SECURITY_CONFIG.PBKDF2_ITERATIONS,
    hasher: CryptoJS.algo.SHA256
  });

  const encKey = CryptoJS.lib.WordArray.create(derived.words.slice(0, 8));
  const macKey = CryptoJS.lib.WordArray.create(derived.words.slice(8, 16));
  
  return { encKey, macKey };
}

/**
 * Generates HMAC for the encrypted components to ensure integrity.
 */
function calculateMAC(payloadParts: string[], macKey: CryptoJS.lib.WordArray): string {
  const dataToAuth = payloadParts.join('|');
  return CryptoJS.HmacSHA256(dataToAuth, macKey).toString();
}

/**
 * Encrypts plaintext using a passphrase.
 * Implements Encrypt-then-MAC for authenticity.
 */
export function encryptText(text: string, passphrase: string, algo: CryptoAlgo): string {
  const salt = CryptoJS.lib.WordArray.random(SECURITY_CONFIG.SALT_SIZE_BYTES);
  const iv = CryptoJS.lib.WordArray.random(SECURITY_CONFIG.IV_SIZE_BYTES);
  
  const { encKey, macKey } = deriveKeys(passphrase, salt);

  const cipher = ALGO_MAP[algo];
  const encrypted = cipher.encrypt(text, encKey, {
    iv: iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  const ciphertextBase64 = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
  
  // Calculate MAC over version, algorithm, salt, iv, and ciphertext
  const mac = calculateMAC(
    [SECURITY_CONFIG.VERSION.toString(), algo, salt.toString(), iv.toString(), ciphertextBase64],
    macKey
  );

  const payload: EncryptedPayload = {
    v: SECURITY_CONFIG.VERSION,
    a: algo,
    s: salt.toString(),
    iv: iv.toString(),
    ct: ciphertextBase64,
    mac: mac
  };

  return JSON.stringify(payload);
}

/**
 * Decrypts a packed ciphertext payload.
 * Validates version, integrity (MAC), and then decrypts.
 */
export function decryptText(packed: string, passphrase: string): string {
  let payload: EncryptedPayload;
  
  try {
    payload = JSON.parse(packed);
    if (!payload.v || !payload.ct || !payload.s || !payload.iv || !payload.mac) {
      throw new Error();
    }
  } catch {
    throw new CryptoError(CryptoErrorCode.INVALID_PAYLOAD);
  }

  // 1. Version Check
  if (payload.v !== SECURITY_CONFIG.VERSION) {
    throw new CryptoError(CryptoErrorCode.UNSUPPORTED_VERSION);
  }

  const salt = CryptoJS.enc.Hex.parse(payload.s);
  const iv = CryptoJS.enc.Hex.parse(payload.iv);
  
  const { encKey, macKey } = deriveKeys(passphrase, salt);

  // 2. Integrity Check (Verify MAC before Decryption)
  const expectedMac = calculateMAC(
    [payload.v.toString(), payload.a, payload.s, payload.iv, payload.ct],
    macKey
  );

  if (expectedMac !== payload.mac) {
    throw new CryptoError(CryptoErrorCode.INTEGRITY_FAILED);
  }

  // 3. Decryption
  const cipher = ALGO_MAP[payload.a] || ALGO_MAP.AES;
  
  try {
    const decrypted = cipher.decrypt(
      { ciphertext: CryptoJS.enc.Base64.parse(payload.ct) } as CryptoJS.lib.CipherParams,
      encKey,
      {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      }
    );

    const plainText = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plainText) throw new Error();
    return plainText;
  } catch {
    throw new CryptoError(CryptoErrorCode.DECRYPTION_FAILED);
  }
}

/**
 * Simple key strength checker
 */
export function checkKeyStrength(key: string): 'weak' | 'medium' | 'strong' {
  if (key.length < 8) return 'weak';
  const hasMixed = /[a-z]/.test(key) && /[A-Z]/.test(key);
  const hasNum = /\d/.test(key);
  const hasSpec = /[!@#$%^&*(),.?":{}|<>]/.test(key);
  
  const score = [hasMixed, hasNum, hasSpec, key.length >= 12].filter(Boolean).length;
  
  if (score >= 3) return 'strong';
  if (score >= 1) return 'medium';
  return 'weak';
}

/**
 * Generates a high-entropy random key
 */
export function generateRandomKey(length = 24): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);
  return Array.from(array, x => chars[x % chars.length]).join('');
}
