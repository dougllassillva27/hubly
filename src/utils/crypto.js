import CryptoJS from 'crypto-js';

const ITERATIONS = 100000;

export const encrypt = (text, secret) => {
  if (!text || !secret) return '';
  // Random salt per encryption (stored alongside ciphertext)
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const key = CryptoJS.PBKDF2(secret, salt, { keySize: 256 / 32, iterations: ITERATIONS });
  const encrypted = CryptoJS.AES.encrypt(text, key).toString();
  // Prepend salt (hex) to ciphertext for decryption
  return salt.toString(CryptoJS.enc.Hex) + ':' + encrypted;
};

export const decrypt = (ciphertext, secret) => {
  if (!ciphertext || !secret) return '';
  try {
    const parts = ciphertext.split(':');
    if (parts.length !== 2) return '';
    const salt = CryptoJS.enc.Hex.parse(parts[0]);
    const key = CryptoJS.PBKDF2(secret, salt, { keySize: 256 / 32, iterations: ITERATIONS });
    const bytes = CryptoJS.AES.decrypt(parts[1], key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
};
