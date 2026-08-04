// Avatar URIs are bounded and allow-listed to prevent memory blow-up and
// non-image payloads. Remote URLs (http/https) are always rejected for privacy.

export const MAX_AVATAR_BASE64_LENGTH = 2_000_000;
const MAX_LOCAL_URI_LENGTH = 4096;

const DATA_IMAGE_RE = /^data:image\/(png|jpe?g|gif|webp);base64,/i;

export function sanitizeAvatarUri(value: string): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  if (value.startsWith('data:')) {
    if (!DATA_IMAGE_RE.test(value)) return null;
    if (value.length > MAX_AVATAR_BASE64_LENGTH) return null;
    return value;
  }
  // Local photo-library / file URIs (bounded length).
  if (value.startsWith('file://') || value.startsWith('ph://')) {
    return value.length <= MAX_LOCAL_URI_LENGTH ? value : null;
  }
  return null;
}

// Imported avatars can only be self-contained data URIs: a file:///ph:// path
// from another device would be a dangling reference (and a potential path
// leak), so it is dropped instead of being stored.
export function sanitizeImportedAvatar(value: string): string | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  if (!value.startsWith('data:')) return null;
  if (!DATA_IMAGE_RE.test(value)) return null;
  if (value.length > MAX_AVATAR_BASE64_LENGTH) return null;
  return value;
}
