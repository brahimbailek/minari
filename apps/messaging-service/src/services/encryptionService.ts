import crypto from 'crypto';

/**
 * Encryption Service for E2E message encryption
 * Uses AES-256-GCM for authenticated encryption
 */

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits

export const encryptionService = {
  /**
   * Generate a new encryption key for a user
   */
  generateKey(): string {
    return crypto.randomBytes(KEY_LENGTH).toString('hex');
  },

  /**
   * Encrypt a message
   */
  encrypt(plaintext: string, keyHex: string): {
    ciphertext: string;
    iv: string;
    authTag: string;
  } {
    try {
      // Generate random IV
      const iv = crypto.randomBytes(IV_LENGTH);

      // Convert hex key to buffer
      const key = Buffer.from(keyHex, 'hex');

      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      // Encrypt
      let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
      ciphertext += cipher.final('hex');

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      return {
        ciphertext,
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex'),
      };
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt message');
    }
  },

  /**
   * Decrypt a message
   */
  decrypt(
    ciphertext: string,
    keyHex: string,
    ivHex: string,
    authTagHex: string
  ): string {
    try {
      // Convert hex to buffers
      const key = Buffer.from(keyHex, 'hex');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
      decipher.setAuthTag(authTag);

      // Decrypt
      let plaintext = decipher.update(ciphertext, 'hex', 'utf8');
      plaintext += decipher.final('utf8');

      return plaintext;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt message');
    }
  },

  /**
   * Encrypt a message and return combined format
   * Format: iv:authTag:ciphertext
   */
  encryptCombined(plaintext: string, keyHex: string): string {
    const { ciphertext, iv, authTag } = this.encrypt(plaintext, keyHex);
    return `${iv}:${authTag}:${ciphertext}`;
  },

  /**
   * Decrypt from combined format
   */
  decryptCombined(combined: string, keyHex: string): string {
    const [iv, authTag, ciphertext] = combined.split(':');
    if (!iv || !authTag || !ciphertext) {
      throw new Error('Invalid encrypted message format');
    }
    return this.decrypt(ciphertext, keyHex, iv, authTag);
  },
};
