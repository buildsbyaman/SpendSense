const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export function uint8ToBase64(bytes: Uint8Array): string {
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const n = (b0 << 16) | (b1 << 8) | b2;
    result += CHARS[(n >> 18) & 63] + CHARS[(n >> 12) & 63];
    if (i + 1 < bytes.length) result += CHARS[(n >> 6) & 63];
    if (i + 2 < bytes.length) result += CHARS[n & 63];
  }
  return result;
}

export function base64ToUint8(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const mod = clean.length % 4;
  const padded = clean + (mod === 0 ? '' : '='.repeat(4 - mod));
  const out = new Uint8Array(Math.floor((padded.length * 3) / 4));
  let j = 0;
  for (let i = 0; i < padded.length; i += 4) {
    const c0 = CHARS.indexOf(padded[i]);
    const c1 = CHARS.indexOf(padded[i + 1]);
    const c2 = padded[i + 2] === '=' ? 0 : CHARS.indexOf(padded[i + 2]);
    const c3 = padded[i + 3] === '=' ? 0 : CHARS.indexOf(padded[i + 3]);
    const n = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;
    out[j++] = (n >> 16) & 255;
    if (padded[i + 2] !== '=') out[j++] = (n >> 8) & 255;
    if (padded[i + 3] !== '=') out[j++] = n & 255;
  }
  return out.slice(0, j);
}

export function stringToUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export function utf8ToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function encodeUtf8Base64(str: string): string {
  return uint8ToBase64(stringToUtf8(str));
}

export function decodeUtf8Base64(b64: string): string {
  return utf8ToString(base64ToUint8(b64));
}
