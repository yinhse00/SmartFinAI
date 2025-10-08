/**
 * Client-side encryption utility using Web Crypto API
 * Encrypts sensitive data before storing in localStorage
 */

// Derive encryption key from a password using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: new Uint8Array(salt),
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// Generate a consistent password from browser fingerprint
function getBrowserFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
  }
  
  return [
    navigator.userAgent,
    navigator.language,
    new Date().getTimezoneOffset(),
    canvas.toDataURL(),
    screen.colorDepth,
    screen.width + 'x' + screen.height,
  ].join('|');
}

/**
 * Encrypt a string value
 * @param plaintext - The string to encrypt
 * @returns Base64 encoded encrypted data with IV
 */
export async function encryptValue(plaintext: string): Promise<string> {
  if (!plaintext) return '';
  
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);
    
    // Generate random salt and IV
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    
    // Derive key from browser fingerprint
    const key = await deriveKey(getBrowserFingerprint(), salt);
    
    // Encrypt the data
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    
    // Return as base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    // Fallback to plain text if encryption fails (for compatibility)
    return plaintext;
  }
}

/**
 * Decrypt a string value
 * @param ciphertext - Base64 encoded encrypted data
 * @returns Decrypted string
 */
export async function decryptValue(ciphertext: string): Promise<string> {
  if (!ciphertext) return '';
  
  try {
    // Decode from base64
    const combined = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    
    // Extract salt, IV, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);
    
    // Derive key
    const key = await deriveKey(getBrowserFingerprint(), salt);
    
    // Decrypt
    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    // If decryption fails, assume it's plain text (migration path)
    return ciphertext;
  }
}

/**
 * Check if a value is encrypted
 * @param value - The value to check
 * @returns True if the value appears to be encrypted
 */
export function isEncrypted(value: string): boolean {
  if (!value) return false;
  
  try {
    // Encrypted values are base64 and have minimum length (salt + iv + data)
    const decoded = atob(value);
    return decoded.length >= 28; // 16 (salt) + 12 (iv) minimum
  } catch {
    return false;
  }
}
