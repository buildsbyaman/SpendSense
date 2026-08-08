import { getDriveAccessToken } from './client';
import {
  BACKUP_FILE_PREFIX,
  BACKUP_EXTENSION,
  BACKUP_MIME_TYPE,
} from '@/lib/backup/config';
import { type BackupContent } from '@/lib/backup/build';

export interface DriveBackupFile {
  id: string;
  name: string;
  createdTime: string | null;
  size: string | null;
}

const DRIVE_API = 'https://www.googleapis.com/drive/v3';
const DRIVE_UPLOAD_API = 'https://www.googleapis.com/upload/drive/v3';

async function driveErrorMessage(res: Response, action: string): Promise<string> {
  let detail = '';
  try {
    const body = await res.json();
    if (body?.error?.message) detail = ` (${body.error.message})`;
  } catch {
    // Non-JSON error body; keep the generic message.
  }
  return `Could not ${action}${detail}.`;
}

export function isBackupFileName(name: string): boolean {
  return name.startsWith(BACKUP_FILE_PREFIX) && name.endsWith(BACKUP_EXTENSION);
}

/**
 * Lists the app's backups on the user's Drive, newest first. Only files created
 * by this app are shown, so unrelated Drive files are never touched.
 */
export async function listDriveBackups(): Promise<DriveBackupFile[]> {
  const token = await getDriveAccessToken();
  const q = `name contains '${BACKUP_FILE_PREFIX}' and trashed = false`;
  const url =
    `${DRIVE_API}/files?q=${encodeURIComponent(q)}` +
    `&fields=files(id,name,createdTime,size,mimeType)` +
    `&orderBy=createdTime%20desc&pageSize=100&spaces=drive`;

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(await driveErrorMessage(res, 'list backups'));

  const data = await res.json();
  return ((data.files ?? []) as Record<string, string>[])
    .filter((f) => isBackupFileName(String(f.name ?? '')))
    .map((f) => ({
      id: String(f.id),
      name: String(f.name),
      createdTime: f.createdTime ?? null,
      size: f.size ?? null,
    }));
}

/**
 * Uploads a backup. Uses two sequential calls (create metadata, then a media
 * upload) to avoid manually assembling a multipart body.
 */
export async function uploadDriveBackup(content: BackupContent): Promise<DriveBackupFile> {
  const token = await getDriveAccessToken();

  const createRes = await fetch(`${DRIVE_API}/files?fields=id,name`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: content.filename, mimeType: content.mimeType }),
  });
  if (!createRes.ok) throw new Error(await driveErrorMessage(createRes, 'create the backup file'));

  const created = await createRes.json();

  const uploadRes = await fetch(
    `${DRIVE_UPLOAD_API}/files/${encodeURIComponent(created.id)}?uploadType=media`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': BACKUP_MIME_TYPE,
      },
      body: content.content,
    }
  );
  if (!uploadRes.ok) {
    // Clean up the metadata-only file so a failed upload doesn't leave junk.
    await fetch(`${DRIVE_API}/files/${encodeURIComponent(created.id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }).catch(() => {});
    throw new Error(await driveErrorMessage(uploadRes, 'upload the backup'));
  }

  const file = await uploadRes.json();
  return {
    id: String(file.id),
    name: String(file.name),
    createdTime: file.createdTime ?? null,
    size: file.size ?? null,
  };
}

export async function downloadDriveBackup(fileId: string): Promise<string> {
  const token = await getDriveAccessToken();
  const res = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}?alt=media`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await driveErrorMessage(res, 'download the backup'));
  return await res.text();
}

export async function deleteDriveBackup(fileId: string): Promise<void> {
  const token = await getDriveAccessToken();
  const res = await fetch(`${DRIVE_API}/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await driveErrorMessage(res, 'delete the backup'));
}
