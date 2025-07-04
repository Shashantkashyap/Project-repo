import CryptoJS from 'crypto-js';

export function encryptSectionData(sectionData, secretKey) {
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify(sectionData),
    secretKey
  ).toString();
  return encrypted;
}
