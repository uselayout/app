import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is required for token encryption");
  }
  // Key must be 32 bytes (256 bits). Accept hex-encoded or base64-encoded.
  if (key.length === 64) return Buffer.from(key, "hex");
  return Buffer.from(key, "base64").subarray(0, 32);
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns: base64-encoded string of `iv:ciphertext:authTag`
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  // Concatenate iv + ciphertext + authTag and base64 encode
  const combined = Buffer.concat([iv, encrypted, authTag]);
  return combined.toString("base64");
}

/**
 * Decrypt a string encrypted by `encrypt()`.
 * Input: base64-encoded `iv + ciphertext + authTag`
 */
export function decrypt(encryptedBase64: string): string {
  const key = getEncryptionKey();
  const combined = Buffer.from(encryptedBase64, "base64");
  const iv = combined.subarray(0, IV_LENGTH);
  const authTag = combined.subarray(combined.length - TAG_LENGTH);
  const ciphertext = combined.subarray(IV_LENGTH, combined.length - TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}

/**
 * Check if a value appears to be encrypted (base64-encoded, minimum length).
 * Used to handle migration: existing plaintext tokens won't match this pattern.
 */
export function isEncrypted(value: string): boolean {
  // Encrypted values are base64 and at least IV + TAG length
  if (value.length < 40) return false;
  return /^[A-Za-z0-9+/]+=*$/.test(value);
}
