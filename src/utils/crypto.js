import CryptoJS from 'crypto-js';

export const encrypt = (text, secret) => {
  if (!text || !secret) return '';
  return CryptoJS.AES.encrypt(text, secret).toString();
};

export const decrypt = (ciphertext, secret) => {
  if (!ciphertext || !secret) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secret);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
};
