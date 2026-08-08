import * as Crypto from 'expo-crypto';
import { gcm } from '@noble/ciphers/aes.js';
import { scryptAsync } from '@noble/hashes/scrypt.js';
import { stringToUtf8, utf8ToString, uint8ToBase64, base64ToUint8 } from '@/lib/import/base64';

// scrypt cost parameters. N = 2^15 (32 MiB memory) keeps the derivation fast
// enough on phones while still being meaningful against brute force. r=8, p=1
// are the common defaults.
const SCRYPT_N = 1 << 15;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 32; // AES-256
const IV_LENGTH = 12; // GCM standard nonce size
const SALT_LENGTH = 16;

export interface EncryptedPayload {
  encrypted: true;
  kdf: 'scrypt';
  salt: string;
  iv: string;
  data: string;
}

async function deriveKey(password: string, salt: Uint8Array): Promise<Uint8Array> {
  return scryptAsync(password, salt, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    dkLen: KEY_LENGTH,
  });
}

export async function encryptBackup(
  plaintext: string,
  password: string
): Promise<EncryptedPayload> {
  const salt = await Crypto.getRandomBytesAsync(SALT_LENGTH);
  const iv = await Crypto.getRandomBytesAsync(IV_LENGTH);
  const key = await deriveKey(password, salt);
  const cipher = gcm(key, iv);
  const ciphertext = cipher.encrypt(stringToUtf8(plaintext));
  return {
    encrypted: true,
    kdf: 'scrypt',
    salt: uint8ToBase64(salt),
    iv: uint8ToBase64(iv),
    // GCM appends its 16-byte auth tag to the ciphertext. The tag doubles as a
    // wrong-password detector: decryption throws when the tag fails to verify.
    data: uint8ToBase64(ciphertext),
  };
}

export async function decryptBackup(
  payload: EncryptedPayload,
  password: string
): Promise<string> {
  const key = await deriveKey(password, base64ToUint8(payload.salt));
  const cipher = gcm(key, base64ToUint8(payload.iv));
  const plaintext = cipher.decrypt(base64ToUint8(payload.data));
  return utf8ToString(plaintext);
}
