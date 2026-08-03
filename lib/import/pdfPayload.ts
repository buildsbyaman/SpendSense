import { decodeUtf8Base64 } from './base64';

export interface PdfPayload {
  app: string;
  currency: string;
  tables: { title: string; columns: string[]; rows: Record<string, string | number>[] }[];
}

export type PdfDecodeFailure =
  | { reason: 'no-subject' }
  | { reason: 'decode-failed'; detail: string }
  | { reason: 'not-spendsense' };

export type PdfDecodeResult = { ok: true; payload: PdfPayload } | { ok: false } & PdfDecodeFailure;

export function decodePayloadFromPdf(pdfText: string): PdfDecodeResult {
  // Try literal string: /Subject (base64...)
  const literalMatch = pdfText.match(/\/Subject\s*\(([^)]*)\)/);
  // Try hex string: /Subject <hex...>
  const hexMatch = !literalMatch ? pdfText.match(/\/Subject\s*<([0-9A-Fa-f\s]+)>/) : null;
  const match = literalMatch ?? hexMatch;
  if (!match) return { ok: false, reason: 'no-subject' };

  try {
    let b64: string;
    if (hexMatch) {
      // PDF hex string: each pair of hex digits = one byte. Convert to UTF-8 via bytes.
      const hex = match[1].replace(/\s/g, '');
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
      const text = new TextDecoder().decode(bytes);
      // The hex-encoded subject contains base64 text as the original string
      b64 = text;
    } else {
      b64 = match[1];
    }
    const json = decodeUtf8Base64(b64);
    const obj = JSON.parse(json);
    if (obj.app === 'SpendSense' && Array.isArray(obj.tables))
      return { ok: true, payload: obj };
    return { ok: false, reason: 'not-spendsense' };
  } catch (e) {
    return { ok: false, reason: 'decode-failed', detail: e instanceof Error ? e.message : String(e) };
  }
}
