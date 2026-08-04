import { type UserProfile } from '@/lib/repository';
import { type ExportedTable } from './types';

export function buildProfileTable(profile: UserProfile, includeAvatar: boolean): ExportedTable {
  const rows: Record<string, string>[] = [
    { Field: 'Name', Value: profile.name },
    { Field: 'Currency Symbol', Value: profile.currencySymbol },
    { Field: 'Currency Code', Value: profile.currencyCode },
  ];
  // The avatar is a base64 data URI that can reach ~2MB. Embedding it in
  // XLSX breaks Excel's 32,767-char cell limit and inflates the PDF payload;
  // JSON (the lossless backup format) keeps it for round-trip fidelity.
  if (includeAvatar) {
    rows.push({ Field: 'Avatar', Value: profile.avatar ?? '—' });
  }
  return { title: 'Profile', columns: ['Field', 'Value'], rows };
}
