import CryptoJS from 'crypto-js';

const SALT = 'hubly-vault-salt-v1';
const ITERATIONS = 100000;

function deriveKey(secret) {
  return CryptoJS.PBKDF2(secret, SALT, { keySize: 256 / 32, iterations: ITERATIONS });
}

export const encrypt = (text, secret) => {
  if (!text || !secret) return '';
  const key = deriveKey(secret);
  return CryptoJS.AES.encrypt(text, key).toString();
};

export const decrypt = (ciphertext, secret) => {
  if (!ciphertext || !secret) return '';
  try {
    const key = deriveKey(secret);
    const bytes = CryptoJS.AES.decrypt(ciphertext, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
};
