import CryptoJS from 'crypto-js';

/**
 * Attempts to decrypt data using multiple methods to handle different encryption formats
 * @param {string} encryptedData - The encrypted data string
 * @param {string} secretKey - The secret key for decryption
 * @returns {Object|null} The decrypted data object or null if decryption fails
 */
export function decryptData(encryptedData, secretKey) {
  if (!encryptedData || !secretKey) {
    console.error('Missing encrypted data or secret key');
    return null;
  }
  
  // Special case for mock data
  if (encryptedData === "mockEncryptedData") {
    return [
      {
        id: 1,
        user: "John Doe",
        email: "john@example.com",
        date: "2023-10-15",
        completionRate: 100,
        result: "Software Developer"
      },
      {
        id: 2,
        user: "Jane Smith",
        email: "jane@example.com",
        date: "2023-10-14",
        completionRate: 100,
        result: "Full Stack Developer"
      },
      {
        id: 3,
        user: "Robert Johnson",
        email: "robert@example.com",
        date: "2023-10-13",
        completionRate: 75,
        result: "In Progress"
      }
    ];
  }

  const decryptionMethods = [
    // Method 1: Standard AES decryption with Base64 encoding
    () => {
      try {
        const decoded = atob(encryptedData);
        const bytes = CryptoJS.AES.decrypt(decoded, secretKey);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedText);
      } catch (e) {
        console.log('Decryption Method 1 failed:', e.message);
        return null;
      }
    },
    
    // Method 2: Direct AES decryption without Base64 decoding
    () => {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedText);
      } catch (e) {
        console.log('Decryption Method 2 failed:', e.message);
        return null;
      }
    },
    
    // Method 3: Using Hex encoding
    () => {
      try {
        const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
        const decryptedText = bytes.toString(CryptoJS.enc.Latin1);
        return JSON.parse(decryptedText);
      } catch (e) {
        console.log('Decryption Method 3 failed:', e.message);
        return null;
      }
    },
    
    // Method 4: Using Base64 encoding for the key
    () => {
      try {
        const keyBytes = CryptoJS.enc.Base64.parse(secretKey);
        const bytes = CryptoJS.AES.decrypt(encryptedData, keyBytes);
        const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
        return JSON.parse(decryptedText);
      } catch (e) {
        console.log('Decryption Method 4 failed:', e.message);
        return null;
      }
    }
  ];

  // Try each method until one succeeds
  for (const method of decryptionMethods) {
    const result = method();
    if (result) {
      console.log('Decryption successful!');
      return result;
    }
  }

  // If all methods fail
  console.error('All decryption methods failed');
  return null;
}
