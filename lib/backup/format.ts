import { decryptBackup, type EncryptedPayload } from './crypto';

export const BACKUP_APP = 'SpendSense';
export const BACKUP_FORMAT_VERSION = 1;

export type BackupParseResult =
  | {
      encrypted: true;
      createdAt?: string;
      decrypt: (password: string) => Promise<string>;
    }
  | { encrypted: false; innerJson: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * Inspects a downloaded backup file and returns either the encrypted container
 * (requiring a password to read) or the plain inner JSON that can be fed
 * straight into the import pipeline.
 */
export function detectBackup(text: string): BackupParseResult {
  let parsed: unknown = null;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = null;
  }

  if (
    isRecord(parsed) &&
    parsed.app === BACKUP_APP &&
    parsed.backupFormat === BACKUP_FORMAT_VERSION &&
    parsed.encrypted === true &&
    isRecord(parsed.data)
  ) {
    const payload = parsed.data as unknown as EncryptedPayload;
    return {
      encrypted: true,
      createdAt: typeof parsed.createdAt === 'string' ? parsed.createdAt : undefined,
      decrypt: (password: string) => decryptBackup(payload, password),
    };
  }

  return { encrypted: false, innerJson: text };
}
