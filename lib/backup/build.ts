import { tablesToJSON } from '@/lib/export/serialize';
import { type ExportedTable } from '@/lib/export/buildExportData';
import { encryptBackup } from './crypto';
import { BACKUP_APP, BACKUP_FORMAT_VERSION } from './format';
import { BACKUP_FILE_PREFIX, BACKUP_EXTENSION, BACKUP_MIME_TYPE } from './config';

export interface BackupContent {
  filename: string;
  mimeType: string;
  content: string;
}

function timestampForFilename(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}${pad(date.getMinutes())}`
  );
}

/**
 * Serializes the full database into a Drive backup file. Without a password the
 * file is the same plain JSON export the app already produces; with a password
 * it is wrapped in an encrypted container (`lib/backup/format.ts`).
 */
export async function buildBackupContent(
  tables: ExportedTable[],
  profile: { name: string; currencyCode: string },
  password?: string
): Promise<BackupContent> {
  const innerJson = tablesToJSON(tables, profile);
  const now = new Date();
  const filename = `${BACKUP_FILE_PREFIX}${timestampForFilename(now)}${BACKUP_EXTENSION}`;

  if (!password) {
    return { filename, mimeType: BACKUP_MIME_TYPE, content: innerJson };
  }

  const container = {
    app: BACKUP_APP,
    backupFormat: BACKUP_FORMAT_VERSION,
    encrypted: true,
    createdAt: now.toISOString(),
    data: await encryptBackup(innerJson, password),
  };

  return { filename, mimeType: BACKUP_MIME_TYPE, content: JSON.stringify(container) };
}
